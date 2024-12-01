const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  resetPassWordToken: String,
  resetPassWordExpires: Date, 
  createdAt: {
    type: Date,
    default: Date.now
  },
  blocked: {
    type: [String]
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
