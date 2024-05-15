const express = require('express');
const rootRouter = express.Router();

const users = require('./users_routes/user.route');
const messages = require('./message_routes/message.route');
const chats = require('./chat_routes/chat.route');

rootRouter.use('/', users);
rootRouter.use('/', messages);
rootRouter.use('/', chats);

module.exports = rootRouter;