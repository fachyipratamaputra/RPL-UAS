const db = require('../config/db');

// 1. Ambil semua produk
exports.getAllProduk = async (req, res) => {
    const { kategori } = req.query;
    let query = 'SELECT * FROM produk';
    let params = [];
    if (kategori) {
        query += ' WHERE LOWER(kategori) = LOWER(?)';
        params.push(kategori);
    }
    try {
        // Disamakan menggunakan .promise() agar konsisten dengan transaksiController
        const [results] = await db.promise().query(query, params);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Ambil produk diskon
exports.getDiscountProducts = async (req, res) => {
    const query = `SELECT * FROM produk WHERE diskon > 0 ORDER BY diskon DESC, RAND() LIMIT 4`;
    try {
        const [results] = await db.promise().query(query);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Pencarian produk
exports.searchProduk = async (req, res) => {
    const keyword = req.query.q || '';
    const searchPattern = `%${keyword}%`;
    const query = `SELECT * FROM produk WHERE nama_produk LIKE ? OR deskripsi LIKE ?`;
    try {
        const [results] = await db.promise().query(query, [searchPattern, searchPattern]);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Tambah produk baru (SINKRON dengan router.post)
exports.addProduk = async (req, res) => {
    const { nama_produk, harga, stok, diskon, kategori, gambar } = req.body;
    const query = 'INSERT INTO produk (nama_produk, harga, stok, diskon, kategori, gambar) VALUES (?, ?, ?, ?, ?, ?)';
    try {
        const [result] = await db.promise().query(query, [nama_produk, harga, stok || 0, diskon || 0, kategori, gambar]);
        res.status(201).json({ message: "Produk berhasil ditambahkan!", id_product: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Update diskon
exports.updateDiskon = async (req, res) => {
    const id = req.params.id;
    const { diskon } = req.body;
    const query = 'UPDATE produk SET diskon = ? WHERE id_product = ?';
    try {
        const [result] = await db.promise().query(query, [diskon, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Produk tidak ditemukan!" });
        res.status(200).json({ message: `Update sukses! Diskon menjadi ${diskon}%` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. Ambil produk berdasarkan ID
exports.getProdukById = async (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM produk WHERE id_product = ?';
    try {
        const [results] = await db.promise().query(query, [id]);
        if (results.length === 0) return res.status(404).json({ message: "Produk tidak ditemukan!" });
        res.status(200).json(results[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};