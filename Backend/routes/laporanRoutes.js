const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');

// Base URL di server.js: /api/laporan
router.get('/admin', laporanController.getLaporanHarian);

module.exports = router;