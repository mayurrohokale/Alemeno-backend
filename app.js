require('dotenv').config({path:'.env'});
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Course = require('./courseSchema');
const User = require('./userSchema');
const courseLogSchema = require('./courseLogSchema');
const cors = require("cors");
const app = express();
const PORT = 8000;
const JWT_SECRET = process.env.jwt_secret || ''; 
const MONGO_URL=process.env.mongourl || '';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URL, {
    useNewUrlParser: true
});

// User signup
app.post('/signup', async (req, res) => {
    const { name, password, email } = req.body;
    try {
        if (!name || !password || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, name, password: hashedPassword })
        const user_data = { name: name, email: email, _id: String(user._id) };
        const token = jwt.sign(
          user_data,
          JWT_SECRET
        );
        res.status(200).json({ message: 'Signup successful', token, user :user_data});
    } catch (err) {
        res.status(400).json({ message: 'Email already taken' });
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { name: user.name, email: user.email, _id: String(user._id) },
      JWT_SECRET
    );
    res.status(200).json({ message: 'Login successful', token, user : {name: user.name, email: user.email}});
});

// Middleware for verifying JWT
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    });
};

app.get('/profile', verifyToken, async (req, res) => {
    try {
    const user = await User.findOne({ email: req.user.email });
    res.status(200).json({ name: user.name, email: user.email, _id: user._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Protected route (requires JWT)
app.get('/courses',  async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/courses/enrolled', verifyToken, async (req, res) => {
  const studentId = new mongoose.Types.ObjectId(req.user._id);

  try {
    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const pipeline = [
      {
        $match: {
          status: { $in: ["enrolled", "completed"]},
          user_id: studentId,
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
    //   {
    //     $replaceRoot: {
    //       newRoot: "$course",
    //     },
    //   },
    ];
    const courses = await courseLogSchema.aggregate(pipeline);
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/create-course', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (user?.role !== 'admin'){
            return res.status(401).json({ message: "Unauthorised: You don't have access to create course" });
        }
        const course = await Course.create({ ...req.body });
        res.status(200).json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/courses/:id', async (req, res) => {
    try {
        const course_id = new mongoose.Types.ObjectId(req.params.id)
        const course = await Course.findOne({ _id: course_id });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
);


app.get('/courses/:id/status', verifyToken, async (req, res) => {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const studentId = new mongoose.Types.ObjectId(req.user._id);
    try {
        const courseLog = await courseLogSchema.findOne({ course_id: courseId, user_id: studentId }, { _id:1, user_id:1, course_id:1, status: 1, liked: 1 });
        if (!courseLog) {
            return res.status(404).json({ message: 'Not enrolled' });
        }
        res.status(200).json(courseLog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/courses/:id/update-status', verifyToken, async (req, res) => {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const studentId = new mongoose.Types.ObjectId(req.user._id);
    const status = req.body.status  // status = 'enroll' or 'unenroll' or 'completed'
    // console.log(status.status);
    try {
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const user = await User.findById(studentId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const checkLog = await courseLogSchema.findOne({course_id: courseId, user_id: studentId});
        let courseLog = null;
        if (checkLog) {
            const update_data = { status: status };
            if (status == "liked" || status == "disliked") {
                update_data = liked == "liked" ? true : false;
                delete update_data.status 
            }

            // ignore null values in update_data object 
            courseLog = await courseLogSchema.findOneAndUpdate({
                course_id: courseId,
                user_id: studentId
            }, update_data, { new: true }); 
        } else {
            courseLog =  courseLogSchema.create({
                course_id: courseId,
                user_id: studentId,
                status: status == "liked" || status == "disliked" ? null : status,
                liked: status == "liked" ? true : false
            });
        }

        if (!courseLog) {
            return res.status(500).json({ message: 'Failed to update status' });
        }
        res.status(200).json(courseLog); 


    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
