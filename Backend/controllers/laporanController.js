const db = require('../config/db');

// R-08: Menghitung Omset Penjualan dan Menampilkan Sisa Persediaan
exports.getLaporanHarian = async (req, res) => {
    try {
        // Ambil akumulasi data transaksi dari tabel orders
        const [stats] = await db.promise().query('SELECT COUNT(*) AS total_transaksi, SUM(total_harga) AS total_omset FROM orders');
        
        // Ambil data stok gudang baju real-time dari tabel produk
        const [stokGudang] = await db.promise().query('SELECT id_product, nama_produk, stok, kategori FROM produk');

        res.json({
            laporan_internal_admin: {
                total_orderan_sukses: stats[0].total_transaksi || 0,
                total_pendapatan_bersih: stats[0].total_omset || 0,
                data_persediaan_gudang: stokGudang
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};