const express = require('express');
const router = express.Router();

const chatbotController =
require('../controllers/chatbotController');

const {
    verifyToken
} = require('../middlewares/authMiddleware');

router.post(
    '/tanya',
    verifyToken,
    chatbotController.handleChat
);

module.exports = router;