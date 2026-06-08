const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Base URL di server.js: /api/chatbot
router.post('/tanya', chatbotController.handleChat);

module.exports = router;