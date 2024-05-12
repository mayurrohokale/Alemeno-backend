const mongoose = require('mongoose');

const courseLogSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.utcnow },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, default: null },
  liked: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.utcnow, default: null},
  enrolled_at: { type: Date, default: Date.utcnow, default: null},
  completed_at: { type: Date, default: Date.utcnow, default: null },
});

module.exports = mongoose.model("CourseLogs", courseLogSchema);