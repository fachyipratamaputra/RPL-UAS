const db = require('../config/db');

// 1. FUNGSI CHECKOUT
exports.checkout = (req, res) => {
    const id_user = req.user.id_user;
    const { items, metode_pembayaran, ongkir } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Keranjang belanja kosong!" });
    }
    if (!metode_pembayaran) {
        return res.status(400).json({ message: "Metode pembayaran wajib dipilih!" });
    }
    const biaya_kirim = parseFloat(ongkir) || 0;

    db.beginTransaction(async (err) => {
        if (err) return res.status(500).json({ error: err.message });

        let subtotal_barang = 0; 
        let rincian_barang = [];

        try {
            for (let item of items) {
                const [targetProduk] = await db.promise().query('SELECT * FROM produk WHERE id_product = ?', [item.id_product]);

                if (targetProduk.length === 0) throw new Error(`Produk ID ${item.id_product} tidak ditemukan`);
                
                const produkData = targetProduk[0];
                if (produkData.stok < item.jumlah) throw new Error(`Stok ${produkData.nama_produk} tidak cukup`);

                let harga_satuan = produkData.diskon > 0 
                    ? produkData.harga - (produkData.harga * (produkData.diskon / 100)) 
                    : produkData.harga;

                let subtotal = harga_satuan * item.jumlah;
                subtotal_barang += subtotal; 

                await db.promise().query('UPDATE produk SET stok = stok - ? WHERE id_product = ?', [item.jumlah, item.id_product]);

                rincian_barang.push({ id_product: produkData.id_product, nama_produk: produkData.nama_produk, jumlah: item.jumlah, subtotal });
            }

            const total_harga_akhir = subtotal_barang + biaya_kirim;

            const [orderResult] = await db.promise().query('INSERT INTO orders (id_user, total_harga) VALUES (?, ?)', [id_user, total_harga_akhir]);
            const id_order_baru = orderResult.insertId;

            for (let rb of rincian_barang) {
                await db.promise().query('INSERT INTO detail_order (id_order, id_product, jumlah, subtotal) VALUES (?, ?, ?, ?)',
                    [id_order_baru, rb.id_product, rb.jumlah, rb.subtotal]);
            }

            await db.promise().query('INSERT INTO pembayaran (id_order, metode, status_pembayaran) VALUES (?, ?, "Lunas")', [id_order_baru, metode_pembayaran]);

            await db.promise().query('DELETE FROM cart WHERE id_user = ?', [id_user]);

            db.commit((err) => {
                if (err) throw err;
                res.status(201).json({
                    message: "Checkout berhasil!",
                    struk: { id_transaksi: id_order_baru, total: total_harga_akhir }
                });
            });

        } catch (error) {
            db.rollback(() => {
                res.status(400).json({ message: error.message });
            });
        }
    });
};

// 2. FUNGSI GET HISTORY (Pastikan pakai kata kunci 'exports.')
exports.getHistory = async (req, res) => {
    const id_user = req.user.id_user;

    try {
        const [orders] = await db.promise().query(
            `SELECT o.id_order, o.total_harga, o.tanggal_order, o.status_order, p.metode 
             FROM orders o
             LEFT JOIN pembayaran p ON o.id_order = p.id_order
             WHERE o.id_user = ? 
             ORDER BY o.tanggal_order DESC`, 
            [id_user]
        );

        if (orders.length === 0) {
            return res.status(200).json([]);
        }

        const riwayatLengkap = [];
        
        for (let order of orders) {
            const [items] = await db.promise().query(
                `SELECT do.jumlah, do.subtotal, pr.nama_produk 
                 FROM detail_order do
                 JOIN produk pr ON do.id_product = pr.id_product
                 WHERE do.id_order = ?`,
                [order.id_order]
            );

            riwayatLengkap.push({
                id_order: order.id_order,
                total_harga: order.total_harga,
                tanggal_order: order.tanggal_order,
                status_order: order.status_order || 'processing', 
                metode_pembayaran: order.metode,
                items: items 
            });
        }

        res.status(200).json(riwayatLengkap);

    } catch (error) {
        console.error("Error Get History:", error);
        res.status(500).json({ message: "Gagal mengambil data riwayat pesanan server", error: error.message });
    }
};