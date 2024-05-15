const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types

const messageSchema = new mongoose.Schema({
flag: {type: String, required: false},
text: {type: String, required: false},
image: {type: String, required: false},
file: {type: String, required: false},
audio: {type: String, required: false},
video: {type: String, required: false},
location: {type: String, required: false},
sent: {type: Boolean, required: false},
receive: {type: Boolean, required: false},
pending: {type: Boolean, required: false},
read: {type: Boolean, required: false},
receiverone: {type: String, required: false},
receivertwo: {type: String, required: false},
chatId:{type: String, required: false},
senderId: {type: ObjectId,ref:"User", required: true},
receiverId: {type: ObjectId,ref:"User", required: true},
},{timestamps: true})

module.exports = mongoose.model("Message", messageSchema)



