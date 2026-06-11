const db = require('../config/db');

//Tampilkan daftar produk dan pencarian kategori
exports.getAllProduk = (req, res) => {
    const { kategori } = req.query;
    let query = 'SELECT * FROM produk';
    let params = [];

    if (kategori) {
        query += ' WHERE LOWER(kategori) = LOWER(?)';
        params.push(kategori);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

//tambah produk (admin)
exports.addProduk = (req, res) => {
    const { nama_produk, harga, stok, diskon, kategori, gambar } = req.body;
    const query = 'INSERT INTO produk (nama_produk,harga, stok, diskon, kategori, gambar) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(query, [nama_produk, harga, stok || 0, diskon || 0, kategori, gambar], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Produk berhasil ditambahkan!", id_product: result.insertId });
    });
};

exports.updateDiskon = (req, res) => {
    const id = req.params.id;
    const { diskon } = req.body; //ambil nilai kolom diskon barang

    const query = 'UPDATE produk SET diskon = ? WHERE id_product = ?';

    db.query(query, [diskon, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Produk tidak ditemukan!" });
        
        res.json({ message: `Update sukses! Diskon produk ID ${id} menjadi ${diskon}%` });
    });
};