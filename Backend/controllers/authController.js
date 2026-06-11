const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Logika untuk SIGNUP (Menggunakan async/await & Promise)
exports.signup = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // REVISI KEAMANAN: Gembok role agar pendaftar publik otomatis menjadi 'Customer'
        const userRole = 'Customer';

        // Cek apakah email sudah terdaftar
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar! Silakan Login." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user baru
        const queryInsert = 'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(queryInsert, [nama, email, hashedPassword, userRole]);

        res.status(201).json({
            message: "Registrasi akun berhasil!",
            user: { id_user: result.insertId, nama, email, role: userRole }
        });
    } catch (error) {
        console.error("Error Signup:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

// 2. Logika untuk LOGIN (Disinkronkan dengan Controller Keranjang)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Cari user berdasarkan email
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (results.length === 0) {
            return res.status(404).json({ message: "Akun tidak ditemukan!" });
        }

        const user = results[0];
        
        // Validasi password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password salah!" });
        }

        // REVISI PENTING: Gunakan 'id' di dalam payload JWT agar sinkron dengan req.user.id di cartController
        const token = jwt.sign(
            { id: user.id_user, email: user.email, role: user.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d'}
        );

        // Kirim response ke frontend
        res.status(200).json({
            token,
            user: {
                id_user: user.id_user,
                nama: user.nama,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error Login:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

// 3. Logika untuk LOGOUT
exports.logout = (req, res) => {
    res.json({ message: "Logout berhasil, sesi dihapus." });
};