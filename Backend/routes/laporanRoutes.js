const express = require('express');
const router = express.Router();

const laporanController =
require('../controllers/laporanController');

const {
    verifyToken,
    isAdmin
} = require('../middlewares/authMiddleware');

router.get(
    '/',
    verifyToken,
    isAdmin,
    laporanController.getLaporanHarian
);

module.exports = router;