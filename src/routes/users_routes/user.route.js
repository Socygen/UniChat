const express = require('express');
const router = express.Router();

const user_controller = require('./user.controller');

router.post('/signup', user_controller.createUser);
router.post('/login', user_controller.loginUser);
router.post('/fetchUsersByIds', user_controller.fetchUsersByIds);
router.get('/fetchUsers', user_controller.fetchAllUsers);
router.post('/fetchExpotokens', user_controller.fetchExpoTokens);
router.post('/checkContacts', user_controller.checkContacts);
router.get('/fetchUserDetails', user_controller.fetchUserDetails);

module.exports = router
