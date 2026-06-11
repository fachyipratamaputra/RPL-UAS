const db = require('../config/db'); 

const cartController = {
    // 1. TAMBAH KE KERANJANG
    addToCart: async (req, res) => {
        const { id_product, jumlah } = req.body;
        const id_user = req.user ? req.user.id : null;

        if (!id_user) return res.status(401).json({ error: 'Sesi habis, silakan login kembali.' });

        try {
            // REVISI A: Ambil atau Buat id_cart berdasarkan id_user
            let [cart] = await db.query('SELECT id_cart FROM cart WHERE id_user = ?', [id_user]);
            let id_cart;

            if (cart.length === 0) {
                const [newCart] = await db.query('INSERT INTO cart (id_user) VALUES (?)', [id_user]);
                id_cart = newCart.insertId;
            } else {
                id_cart = cart[0].id_cart;
            }

            // REVISI B: Cek produk berdasarkan id_cart (Bukan id_user langsung)
            const [existing] = await db.query(
                'SELECT * FROM cart_items WHERE id_cart = ? AND id_product = ?', 
                [id_cart, id_product]
            );

            if (existing.length > 0) {
                const newJumlah = existing[0].jumlah + parseInt(jumlah);
                await db.query(
                    'UPDATE cart_items SET jumlah = ? WHERE id_cart_item = ?', 
                    [newJumlah, existing[0].id_cart_item]
                );
            } else {
                await db.query(
                    'INSERT INTO cart_items (id_cart, id_product, jumlah) VALUES (?, ?, ?)', 
                    [id_cart, id_product, jumlah]
                );
            }
            res.status(200).json({ message: 'Produk berhasil dimasukkan ke keranjang' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Gagal menambahkan produk ke keranjang.' });
        }
    },

    // 2. AMBIL DATA KERANJANG (GET)
    getCart: async (req, res) => {
        const id_user = req.user ? req.user.id : null; 

        if (!id_user) return res.status(401).json({ error: 'Sesi habis, silakan login kembali.' });

        try {
            // REVISI A: Cari tahu id_cart milik user
            const [cart] = await db.query('SELECT id_cart FROM cart WHERE id_user = ?', [id_user]);
            if (cart.length === 0) return res.status(200).json([]); 

            const id_cart = cart[0].id_cart;

            // REVISI B: JOIN tabel cart_items dengan produk berdasarkan id_cart (Bukan ci.id_user!)
            const [items] = await db.query(
                `SELECT ci.id_cart_item, ci.id_product, ci.jumlah, p.nama_produk, p.harga, p.diskon, p.gambar, p.stok 
                 FROM cart_items ci 
                 JOIN produk p ON ci.id_product = p.id_product 
                 WHERE ci.id_cart = ?`, 
                [id_cart]
            );
            res.status(200).json(items);
        } catch (error) {
            console.error("Error GetCart:", error);
            res.status(500).json({ error: 'Gagal mengambil data keranjang.' });
        }
    },

    // 3. UPDATE KUANTITAS ITEM (PUT)
    updateCartQuantity: async (req, res) => {
        const { id_cart_item, jumlah } = req.body;
        const id_user = req.user ? req.user.id : null;

        if (!id_user) return res.status(401).json({ error: 'Sesi habis, silakan login kembali.' });

        try {
            const [cart] = await db.query('SELECT id_cart FROM cart WHERE id_user = ?', [id_user]);
            if (cart.length === 0) return res.status(404).json({ error: 'Keranjang tidak ditemukan' });

            const id_cart = cart[0].id_cart;

            // REVISI: Update data berdasarkan kecocokan id_cart_item dan id_cart pelindung
            await db.query(
                'UPDATE cart_items SET jumlah = ? WHERE id_cart_item = ? AND id_cart = ?',
                [jumlah, id_cart_item, id_cart]
            );
            res.status(200).json({ message: 'Jumlah kuantitas berhasil diperbarui' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Gagal memperbarui kuantitas produk' });
        }
    },

    // 4. HAPUS ITEM DARI KERANJANG (DELETE)
    removeFromCart: async (req, res) => {
        const id_cart_item = req.params.id;
        const id_user = req.user ? req.user.id : null;

        if (!id_user) return res.status(401).json({ error: 'Sesi habis, silakan login kembali.' });

        try {
            const [cart] = await db.query('SELECT id_cart FROM cart WHERE id_user = ?', [id_user]);
            if (cart.length === 0) return res.status(404).json({ error: 'Keranjang tidak ditemukan' });

            const id_cart = cart[0].id_cart;

            // REVISI: Hapus item berdasarkan relasi tabel yang aman
            await db.query(
                'DELETE FROM cart_items WHERE id_cart_item = ? AND id_cart = ?',
                [id_cart_item, id_cart]
            );
            res.status(200).json({ message: 'Produk berhasil dihapus dari keranjang' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Gagal menghapus produk dari keranjang' });
        }
    }
};

module.exports = cartController;