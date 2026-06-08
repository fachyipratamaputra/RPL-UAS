const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');

router.post('/checkout', transaksiController.checkout);
router.get('/history/:id_user', transaksiController.getHistory);

module.exports = router;