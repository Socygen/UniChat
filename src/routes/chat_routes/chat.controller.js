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
    const { userIds, chatName, groupIcon } = req.body
    let allUsers = userIds
    allUsers.push(req.query.userId)
    try {
        const newChat = await ChatModel.create({
            users: userIds,
            chatName: chatName,
            groupIcon : groupIcon,
            type: "group",
            groupAdmin: req.query.userId
        })
        res.send({
            data: newChat,
            status: true,
        })
    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

const removeUsersFromGroupChat = async (req, res) => {
    const { chatId, userIds } = req.body;
    const userId = req.query.userId;

    if (!Array.isArray(userIds)) {
        return res.status(400).json({ status: false, error: "userIds must be an array" });
    }

    try {
        const chat = await ChatModel.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({ status: false, error: "Chat not found" });
        }

        if (chat.groupAdmin.toString() !== userId) {
            return res.status(403).json({ status: false, error: "Only the group admin can remove users" });
        }

        const userIdsToRemove = userIds.filter(id => id !== chat.groupAdmin.toString());

        chat.users = chat.users.filter(user => !userIdsToRemove.includes(user.toString()));
        await chat.save();

        return res.send({
            data: chat,
            status: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


const addUsersToGroupChat = async (req, res) => {
    const { chatId, userIds } = req.body;
    const userId = req.query.userId;

    if (!Array.isArray(userIds)) {
        return res.status(400).json({ status: false, error: "userIds must be an array" });
    }

    try {
        const chat = await ChatModel.findById(chatId);

        if (!chat) {
            return res.status(404).json({ status: false, error: "Chat not found" });
        }

        if (chat.groupAdmin.toString() !== userId) {
            return res.status(403).json({ status: false, error: "Only the group admin can add users" });
        }

        const uniqueUserIds = [...new Set(userIds)];
        const usersToAdd = uniqueUserIds.filter(id => id !== chat.groupAdmin.toString());

        if (usersToAdd.length === 0) {
            return res.status(400).json({ status: false, error: "No valid users to add" });
        }

        chat.users = [...new Set([...chat.users.map(user => user.toString()), ...usersToAdd])];
        await chat.save();

        return res.json({
            data: chat,
            status: true
        });
    } catch (error) {
        console.error('Error adding users to group chat:', error);
        return res.status(500).json({ status: false, error: "An unexpected error occurred" });
    }
};



const myChats = async (req, res) => {
    try {
        const userId = req.query.userId;
        let chats = await ChatModel.find({ users: userId })
           .populate({
              path: "users",
              select: "userName email mobile online lastSeen profileImage"
           }).sort({ updatedAt: -1 });

            chats = chats.map(chat => {
            const users = chat.users;
            const userIndex = users.findIndex(user => user._id.toString() === userId);
            if (userIndex !== -1 && userIndex !== 0) {
                const temp = users[0];
                users[0] = users[userIndex];
                users[userIndex] = temp;
            }
            return chat;
         });

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
    chatById,
    removeUsersFromGroupChat,
    addUsersToGroupChat
}
