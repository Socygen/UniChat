const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profileImage: {
    type: String,
    required: false
  },
  userName: {
    type: String,
    required: false
  },
  fullName: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  mobile: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  fcmToken: {
    type: String,
    required: false
  },
  online: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: null
  }
})

module.exports = mongoose.model("User", userSchema)
