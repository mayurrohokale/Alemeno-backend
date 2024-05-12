const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.utcnow },
  name: String,
  instructor: String,
  description: String,
  enrollmentStatus: String,
  thumbnail: String,
  duration: String,
  schedule: String,
  location: String,
  prerequisites: [String],
  syllabus: [
    {
      week: Number,
      topic: String,
      content: String,
    },
  ],
//   students: [String], 
//   completedBy: [String], 
//   likedBy: [String], 
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
