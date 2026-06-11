const express = require('express');
const router = express.Router();

// Import Controller & Middleware
const produkController = require('../controllers/produkController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');



// 1. Route ambil semua produk / filter kategori (?kategori=Atasan)
router.get('/', produkController.getAllProduk);

// 2. Route ambil 4 produk promo diskon terbesar
router.get('/diskon', produkController.getDiscountProducts);

// 3. Route fitur pencarian global (?q=keyword)
router.get('/search', produkController.searchProduk);

// 4. Route menambah produk baru (Khusus Admin)
router.post('/', verifyToken, isAdmin, produkController.addProduk);

// 5. Route memperbarui diskon produk (Khusus Admin)
router.patch('/:id/diskon', verifyToken, isAdmin, produkController.updateDiskon);

// 6. Route ambil DETAIL satu produk berdasarkan ID
router.get('/:id', produkController.getProdukById);

module.exports = router;