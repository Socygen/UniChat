const UserModel = require('../models/user');
const MessageModel = require('../models/message');
const socktIdToUserId = new Map();

module.exports = (io) => {

  io.on('connection', (socket) => {

    socket.on("join_room", (chatId) => {
      socket.join(chatId)
      console.log(`User ${socket.id} join room ${chatId}`)
    })

    socket.on("leave_room", (chatId) => {
      socket.leave(chatId)
      console.log(`User ${socket.id} leave room ${chatId}`)
    })

    socket.on("join_chat", (userId) => {
      socket.join(userId)
      console.log(`User ${socket.id} join chat ${userId}`)
    })

    socket.on("leave_chat", (userId) => {
      socket.leave(userId)
      console.log(`User ${socket.id} leave chat ${userId}`)
    })

    socket.on('is_typing', ({ roomId, userId }) => {
      io.to(roomId).emit('user_typing', { userId })
    })

    socket.on('stop_typing', ({ roomId, userId }) => {
      io.to(roomId).emit('user_stopped', { userId })
    })

    socket.on('send_message', (data) => {
      io.to(data.receiverId).emit("send_message", data);
      console.log("Emitted To Receiver", data);
      io.to(data.senderId).emit("new_chat", data);
      console.log("Emitted To Sender", data);
      sendNotification(data);
    })

    socket.on('user_online', async ({ userId }) => {
      try {
        const user = await UserModel.findById(userId);
        if (user) {
          user.online = true;
          await user.save();
          socktIdToUserId.set(socket.id, userId);
          io.emit('user_online', { userId: user._id, online: true, lastSeen: new Date() });
          console.log(`${userId} is now online.`);

          await MessageModel.updateMany(
            { receiverId: userId },
            { $set: { read: true, sent: false, receive: false, pending: false } }
          );

          console.log(`Message status updated for user ${userId}.`);
        }
      } catch (error) {
        console.log("Error updating user status:", error);
      }
    })

    socket.on('disconnect', async () => {
      console.log('Socket disconnected');
      const userId = socktIdToUserId.get(socket.id)
      if (userId) {
        try {
          const user = await UserModel.findById(userId)
          if (user) {
            user.online = false,
              user.lastSeen = new Date();
            await user.save();
            io.emit('user_online', { userId: user._id, online: false, lastSeen: user.lastSeen })
            console.log('user disconnected succesfully...!');
          }
        } catch (error) {
        }
      }
    })
  });
};

const sendNotification = async (notificationData) => {
  try {
    let findUser = await UserModel.findById(notificationData?.receiverId);

    if (!!findUser?.fcmToken) {
        let formdata = {
          to: findUser?.fcmToken,
          title: "New Message",
          body: notificationData?.text,
        };

        const raw = JSON.stringify(formdata);
        var requestOptions = {
          mode: "no-cors",
          method: "POST",
          body: raw,
          redirect: "follow",
        };

        fetch("https://exp.host/--/api/v2/push/send", requestOptions)
          .then((response) => response.text())
          .then((result) => {
            console.log("result", JSON.parse(result));
          })
          .catch((error) => console.error(error));
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
