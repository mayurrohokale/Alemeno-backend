const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: { type: String, required: true},
  password: String,
    role: { type: String, default: 'user' },
    created_at: { type: Date, default: Date.utcnow },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
