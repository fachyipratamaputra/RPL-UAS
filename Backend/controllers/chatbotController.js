const db = require('../config/db');
// Kita balik pakai Axios karena OpenRouter adalah REST API biasa
const axios = require('axios');

// GANTI DENGAN API KEY OPENROUTER KAMU (sk-or-v1-...)
const OPENROUTER_API_KEY = "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";

exports.handleChat = (req, res) => {
    const pesan = req.body.pesan || req.body.message;

    if (!pesan || pesan.trim() === "") {
        return res.json({ 
            balasan: "Halo! Ada yang bisa aku bantu? Yuk tanyain seputar stok baju atau diskon!",
            mode: "Validation Triggered"
        });
    }

    // Ambil data produk terupdate dari database MySQL
    db.query('SELECT nama_produk, harga, stok, diskon, kategori, deskripsi FROM produk', async (err, results) => {
        if (err) {
            console.error("MySQL Error:", err.message);
            return res.status(500).json({ error: "Gagal mengambil data produk" });
        }

        const produkResults = results || [];
        const dataStokToko = produkResults.map(p =>
            `Nama: ${p.nama_produk} | Kategori: ${p.kategori} | Harga: Rp${p.harga} | Stok: ${p.stok} | Diskon: ${p.diskon}%`
        ).join('\n');

        try {
            // --- JALUR UTAMA: MENEMBAK OPENROUTER (GEMINI 1.5 FLASH) ---
            const URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";

            const promptLengkap = `Kamu adalah Chatbot Kasir Virtual yang ramah untuk Toko Baju Online Kelompok 6.
            Jawab pertanyaan customer dengan santun, kasual, singkat, dan informatif berdasarkan data produk asli toko kami ini saja:
            ${dataStokToko}
            
            Pertanyaan Customer: "${pesan}"`;

            // Struktur request OpenRouter mengikuti standar OpenAI format
            const responseOpenRouter = await axios.post(URL_OPENROUTER, {
                model: "google/gemini-1.5-flash:free", // Tetap panggil otak Gemini lewat OpenRouter
                messages: [
                    { role: "user", content: promptLengkap }
                ]
            }, {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 5000 // Batas tunggu 5 detik
            });

            // Cara ekstrak teks jawaban dari OpenRouter
            const balasanAI = responseOpenRouter.data.choices[0].message.content;
            return res.json({ balasan: balasanAI, mode: "Gemini via OpenRouter Terkoneksi" });

        } catch (error) {
            // --- JALUR PENYELAMAT (FALLBACK HYBRID LOKAL) ---
            console.log("⚠️ Jalur AI Terganggu. Mengaktifkan Logika Hybrid Lokal...");
            if (error.response) {
                console.error("👉 Error OpenRouter:", error.response.status, error.response.data);
            } else {
                console.error("👉 Error Sistem:", error.message);
            }

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

            // 2. Skenario Stok / Katalog
            else if (inputUser.includes('stok') || inputUser.includes('baju') || inputUser.includes('cowok') || inputUser.includes('cewek') || inputUser.includes('pria') || inputUser.includes('wanita') || inputUser.includes('produk') || inputUser.includes('lihat')) {
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

            // 3. Jalur Default (Menu Utama)
            return res.json({
                balasan: "Halo! Selamat datang di Kasir Otomatis Kelompok 6. 👋\n\nAda yang bisa dibantu? Silakan ketik kata kunci seperti *'diskon'* atau *'stok baju'* ya!",
                mode: "Backup Hybrid Active"
            });
        }
    });
};