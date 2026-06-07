const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');

router.get('/', produkController.getAllProduk);
router.post('/', produkController.addProduk);
router.put('/:id', produkController.updateDiskon);

module.exports = router;
