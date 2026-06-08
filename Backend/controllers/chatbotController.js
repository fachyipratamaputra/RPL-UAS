const db = require('../config/db');
const axios = require('axios'); 

const GEMINI_API_KEY = "AIzaSyDKeOT-0eeY7gkRfaQioVBKmkGxD1F6LFY";

exports.handleChat = (req, res) => {
    const { pesan } = req.body;

    if (!pesan) {
        return res.json({ balasan: "Halo! Ada yang bisa aku bantu? Yuk tanyain seputar stok baju atau diskon!" });
    }

    // Ambil data produk terupdate dari database MySQL untuk bahan AI maupun Hybrid
    db.query('SELECT nama_produk, harga, stok, diskon, kategori FROM produk', async (err, results) => {
        if (err) {
            console.error("MySQL Error:", err.message);
            return res.status(500).json({ error: "Gagal mengambil data produk" });
        }

        const produkResults = results || [];
        
        // Format data dari MySQL jadi teks string kasar untuk AI
        const dataStokToko = produkResults.map(p => 
            `Nama: ${p.nama_produk} | Kategori: ${p.kategori} | Harga: Rp${p.harga} | Stok: ${p.stok} | Diskon: ${p.diskon}%`
        ).join('\n');

        try {
            // --- JALUR UTAMA: MENEMBAK GEMINI AI ---
            const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            const promptLengkap = `Kamu adalah Chatbot Kasir Virtual yang ramah untuk Toko Baju Online Kelompok 6.
            Jawab pertanyaan customer dengan santun dan kasual berdasarkan data ini saja:
            ${dataStokToko}
            Pertanyaan Customer: "${pesan}"`;

            const responseAIdirect = await axios.post(urlGemini, {
                contents: [{ parts: [{ text: promptLengkap }] }]
            }, { timeout: 4000 });

            const balasanAI = responseAIdirect.data.candidates[0].content.parts[0].text;
            return res.json({ balasan: balasanAI, mode: "Gemini AI Terkoneksi" });

        } catch (error) {
            // --- JALUR PENYELAMAT (FALLBACK): JIKA KUOTA AI HABIS / ERROR ---
            console.log("⚠️ Jalur AI Terganggu (Quota Habis/Error). Mengaktifkan Logika Hybrid Lokal...");

            const inputUser = pesan.toLowerCase();

            // 1. Skenario Diskon / Promo
            if (inputUser.includes('diskon') || inputUser.includes('promo') || inputUser.includes('murah')) {
                let daftarBaju = produkResults.filter(p => p.diskon > 0 || p.harga < 100000).map(p => {
                    let hargaAkhir = p.diskon > 0 ? p.harga - (p.harga * (p.diskon / 100)) : p.harga;
                    return `- *${p.nama_produk}* ${p.diskon > 0 ? `(Diskon ${p.diskon}%)` : ''}: jadi Rp ${hargaAkhir.toLocaleString('id-ID')}`;
                }).join('\n');

                return res.json({ 
                    balasan: `Halo kak! Ini beberapa rekomendasi baju yang lagi hemat/diskon di toko kami:\n\n${daftarBaju || "Saat ini belum ada promo aktif nih."}\n\nYuk buruan di-checkout! 🛒`,
                    mode: "Backup Hybrid Active"
                });
            } 
            
            // 2. Skenario Stok / Kategori Cowok-Cewek
            else if (inputUser.includes('stok') || inputUser.includes('baju') || inputUser.includes('cowok') || inputUser.includes('cewek') || inputUser.includes('produk') || inputUser.includes('lihat')) {
                let filtered = produkResults;
                if (inputUser.includes('cowok') || inputUser.includes('pria')) {
                    filtered = produkResults.filter(p => p.kategori.toLowerCase().includes('pria'));
                } else if (inputUser.includes('cewek') || inputUser.includes('wanita')) {
                    filtered = produkResults.filter(p => p.kategori.toLowerCase().includes('wanita'));
                }

                let daftarStok = filtered.map(p => `- *${p.nama_produk}* | Harga: Rp ${p.harga.toLocaleString('id-ID')} | Stok: ${p.stok} Pcs`).join('\n');
                return res.json({ 
                    balasan: `Berikut katalog baju terupdate di database kami:\n\n${daftarStok || "Koleksi pakaian sedang kosong."}\n\nSilakan cek menu produk untuk pemesanan ya!`,
                    mode: "Backup Hybrid Active"
                });
            } 

            // 3. BARU ✨: Skenario Cek Pesanan / Order
            else if (inputUser.includes('pesanan') || inputUser.includes('order') || inputUser.includes('status')) {
                return res.json({
                    balasan: `Untuk mengecek status pesanan kakak secara real-time, silakan kunjungi halaman **Riwayat Pesanan** melalui menu navigasi di atas, atau klik link berikut: <a href="order-history.html">Riwayat Pesanan Saya</a>. Pastikan sudah login ya kak! 😊`,
                    mode: "Backup Hybrid Active"
                });
            }

            // 4. BARU ✨: Skenario Info Pengiriman / Ongkir
            else if (inputUser.includes('pengiriman') || inputUser.includes('ongkir') || inputUser.includes('kirim') || inputUser.includes('shipping')) {
                return res.json({
                    balasan: `Kami melayani pengiriman ke seluruh wilayah Indonesia menggunakan J&T, JNE, dan SiCepat. 🚚\n\n- **Ongkos Kirim:** Rp15.000 - Rp30.000 (tergantung lokasi alamat).\n- **Promo Spesial:** Minimal belanja Rp200.000 gratis ongkir ke seluruh Indonesia!`,
                    mode: "Backup Hybrid Active"
                });
            }

            // 5. BARU ✨: Skenario Panduan Ukuran / Size Chart
            else if (inputUser.includes('ukuran') || inputUser.includes('size') || inputUser.includes('panduan')) {
                return res.json({
                    balasan: `Berikut adalah standar panduan ukuran (*Size Chart*) baju di toko kami:\n\n- **S (Small):** Lingkar Dada (LD) ~86cm\n- **M (Medium):** Lingkar Dada (LD) ~92cm\n- **L (Large):** Lingkar Dada (LD) ~98cm\n- **XL (Extra Large):** Lingkar Dada (LD) ~104cm\n\n*Tips: Untuk detail kecocokan bahan, kakak bisa melihat langsung di deskripsi tiap produk.* ✨`,
                    mode: "Backup Hybrid Active"
                });
            }

            // 6. Jalur Default (Menu Utama)
            return res.json({ 
                balasan: "Halo! Selamat datang di Kasir Otomatis Kelompok 6. 👋\n\nAda yang bisa dibantu? Silakan ketik kata kunci seperti *'diskon'*, *'stok baju'*, *'cek pesanan'*, atau *'info pengiriman'* ya!",
                mode: "Backup Hybrid Active"
            });
        }
    });
};