const express = require('express');
const router = express.Router();

const chat_controller = require('./chat.controller')
const auth = require('../../middleware/auth');

router.post('/createPrivateChat',auth, chat_controller.createPrivateChat);
router.post('/createGroupChat',auth, chat_controller.createGroupChat);
router.post('/myChats',auth, chat_controller.myChats);
router.get('/chatById',auth, chat_controller.chatById);
router.post('/removegroupUser', chat_controller.removeUsersFromGroupChat);
router.post('/addUsersToGroupChat', chat_controller.addUsersToGroupChat);

module.exports = router
