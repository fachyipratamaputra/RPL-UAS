const express = require('express');
const router = express.Router();

const transaksiController =
require('../controllers/transaksiController');

const {
    verifyToken
} = require('../middlewares/authMiddleware');

router.post(
    '/checkout',
    verifyToken,
    transaksiController.checkout
);

router.get(
    '/history',
    verifyToken,
    transaksiController.getHistory
);

module.exports = router;