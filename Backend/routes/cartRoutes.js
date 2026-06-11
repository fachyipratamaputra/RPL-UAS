const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. Tambah produk ke keranjang (Sudah ada di kodemu)
router.post('/add', verifyToken, cartController.addToCart);

// 2. Ambil semua item di keranjang user (Untuk loadCartFromDatabase)
router.get('/', verifyToken, cartController.getCart);

// 3. Update jumlah/kuantitas item keranjang (Untuk updateQuantityDatabase)
router.put('/update', verifyToken, cartController.updateCartQuantity);

// 4. Hapus item dari keranjang (Untuk removeItemFromDatabase)
router.delete('/delete/:id', verifyToken, cartController.removeFromCart);

module.exports = router;