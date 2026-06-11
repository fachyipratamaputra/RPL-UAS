const express = require('express');
const router = express.Router();

const cartController =
require('../controllers/cartController');

const {
    verifyToken
} = require('../middleware/authMiddleware');

router.post(
    '/add',
    verifyToken,
    cartController.addToCart
);

module.exports = router;