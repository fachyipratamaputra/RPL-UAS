const express = require('express');
const router = express.Router();

const produkController = require('../controllers/produkController');

const {
    verifyToken,
    isAdmin
} = require('../middlewares/authMiddleware');

router.get('/',
    produkController.getAllProduk
);

router.post('/',
    verifyToken,
    isAdmin,
    produkController.addProduk
);

router.patch('/:id/diskon',
    verifyToken,
    isAdmin,
    produkController.updateDiskon
);

module.exports = router;