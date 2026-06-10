const db = require('../config/db');

// R-06, R-07, R-09, R-11: Proses Checkout dari Keranjang ke Tabel Orders & Pembayaran
exports.checkout = (req, res) => {
    const { id_user, items, metode_pembayaran } = req.body; 
    // `items` dikirim dari frontend keranjang berupa array: [{ id_product: 1, jumlah: 2 }]

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Keranjang belanja kamu masih kosong!" });
    }

    // Memulai transaksi SQL aman
    db.beginTransaction(async (err) => {
        if (err) return res.status(500).json({ error: err.message });

        let total_harga_akhir = 0;
        let rincian_barang = [];

        try {
            // 1. Validasi Stok Gudang & Kalkulasi Diskon Otomatis (R-05 & R-07)
            for (let item of items) {
                const [targetProduk] = await db.promise().query('SELECT * FROM produk WHERE id_product = ?', [item.id_product]);
                
                if (targetProduk.length === 0) {
                    db.rollback();
                    return res.status(404).json({ message: `Produk dengan ID ${item.id_product} tidak ditemukan!` });
                }

                const produkData = targetProduk[0];

                // Cek ketersediaan stok
                if (produkData.stok < item.jumlah) {
                    db.rollback();
                    return res.status(400).json({ message: `Stok untuk ${produkData.nama_produk} tidak mencukupi!` });
                }

                // Kalkulasi harga potongan jika ada diskon produk (R-07 & R-10)
                let harga_satuan = produkData.harga;
                if (produkData.diskon > 0) {
                    harga_satuan = produkData.harga - (produkData.harga * (produkData.diskon / 100));
                }

                let subtotal = harga_satuan * item.jumlah;
                total_harga_akhir += subtotal;

                // Kurangi stok barang di MySQL secara real-time
                await db.promise().query('UPDATE produk SET stok = stok - ? WHERE id_product = ?', [item.jumlah, item.id_product]);

                rincian_barang.push({
                    id_product: produkData.id_product,
                    nama_produk: produkData.nama_produk,
                    jumlah: item.jumlah,
                    subtotal: subtotal
                });
            }

            // 2. Masukkan Data ke Tabel `orders` (R-06)
            const [orderResult] = await db.promise().query('INSERT INTO orders (id_user, total_harga) VALUES (?, ?)', [id_user, total_harga_akhir]);
            const id_order_baru = orderResult.insertId;

            // 3. Masukkan Rincian ke Tabel `detail_order`
            for (let rb of rincian_barang) {
                await db.promise().query('INSERT INTO detail_order (id_order, id_product, jumlah, subtotal) VALUES (?, ?, ?, ?)', 
                [id_order_baru, rb.id_product, rb.jumlah, rb.subtotal]);
            }

            // 4. Catat ke Tabel `pembayaran` dengan Pilihan Metode (R-11)
            await db.promise().query('INSERT INTO pembayaran (id_order, metode, status_pembayaran) VALUES (?, ?, "Lunas")', 
            [id_order_baru, metode_pembayaran]);

            // Jika semua langkah di atas sukses tanpa interupsi, simpan permanen ke MySQL
            db.commit((err) => {
                if (err) {
                    db.rollback();
                    return res.status(500).json({ error: err.message });
                }
                
                // Mengembalikan Struk Digital Berhasil (R-06)
                res.status(201).json({
                    message: "Checkout keranjang sukses! Transaksi dicatat ke MySQL.",
                    struk_pembayaran: {
                        id_transaksi: id_order_baru,
                        items: rincian_barang,
                        total_tagihan: total_harga_akhir,
                        metode_pembayaran: metode_pembayaran,
                        status: "Lunas"
                    }
                });
            });

        } catch (error) {
            db.rollback();
            res.status(500).json({ error: error.message });
        }
    });
};

exports.getHistory = (req, res) => {
    const { id_user } = req.params; 

    if (!id_user) {
        return res.status(400).json({ message: "ID User tidak ditemukan!" });
    }

    // Query JOIN untuk mendapatkan nota SEKALIGUS rincian produk yang dibeli
    const query = `
        SELECT 
            o.id_order, o.created_at, o.total_harga, o.status,
            d.jumlah, d.subtotal,
            p.nama_produk, p.gambar,
            pay.metode, pay.status_pembayaran
        FROM orders o
        JOIN detail_order d ON o.id_order = d.id_order
        JOIN produk p ON d.id_product = p.id_product
        LEFT JOIN pembayaran pay ON o.id_order = pay.id_order
        WHERE o.id_user = ?
        ORDER BY o.created_at DESC
    `;

    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Catatan: Karena hasil query JOIN akan menghasilkan baris berulang untuk order yang sama,
        // data ini biasanya diformat atau langsung dikirim ke FE untuk dirender sesuai struktur barisnya.
        res.json({
            success: true,
            data: results
        });
    });
};
