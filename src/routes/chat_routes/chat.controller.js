const ChatModel = require('../../models/chat');

const createPrivateChat = async (req, res) => {
    const { sender, receiver, chatname, serviceId } = req.body;
    let userIds = [sender, receiver];
    
    try {
        const chat = await ChatModel.findOne({
            users: { $all: userIds },
            type: "private"
        })
        if (chat) {
            chat.chatName = req.body.chatName;
            await chat.save();

            res.send({
              data: chat,
              status: true,
            })
            return;
        }
        const newChat = await ChatModel.create({
            users: userIds,
            chatName: req.body.chatName
        })
        res.send({
            data: newChat,
            status: true,
        })
    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

const createGroupChat = async (req, res) => {
    const { userIds, chatName } = req.body
    let allUsers = userIds
    allUsers.push(req.user.user_id)
    try {
        const chat = await ChatModel.findOne({
            users: { $all: allUsers },
            type: "group"
        })
        if (chat) {
            
            res.send({
                data: chat,
                status: true,
            })
            return;
        }
        const newChat = await ChatModel.create({
            users: userIds,
            chatName: chatName,
            type: "group",
            groupAdmin: req.user.user_id
        })
        res.send({
            data: newChat,
            status: true,
        })
    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

const myChats = async (req, res) => {
    try {
        const chats = await ChatModel.find({
            users: req.query.userId
        }).populate({
            path: "users",
            select: "userName email mobile online lastSeen profileImage"
        }).sort({ updatedAt: -1 })
        res.send({
            data: chats,
            status: true,
        })
    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

const chatById = async (req, res) => {
    const chatId = req.query.chatId
    try {
        const chats = await ChatModel.findById(chatId).populate({
            path: "users",
            select: "userName email mobile profileImage online lastSeen"
        })
        res.send({
            data: chats,
            status: true,
        })
    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

module.exports = {
    createPrivateChat,
    createGroupChat,
    myChats,
    chatById
}