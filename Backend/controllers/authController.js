// controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Logika untuk SIGNUP (Sudah Direvisi untuk Keamanan Role)
exports.signup = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // REVISI KEAMANAN: Gembok role agar pendaftar publik otomatis menjadi 'Customer'
        // Jangan biarkan req.body.role menentukan role secara bebas demi keamanan sistem
        const userRole = 'Customer';

        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) {
                return res.status(400).json({ message: "Email sudah terdaftar! Silahkan Login" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const queryInsert = 'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)';

            db.query(queryInsert, [nama, email, hashedPassword, userRole], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({
                    message: "Registrasi akun berhasil!",
                    user: { id_user: result.insertId, nama, email, role: userRole }
                });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Logika untuk LOGIN (Tetap seperti kode awal Anda)
exports.login = (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "Akun tidak ditemukan!" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Password salah!" });

        const token = jwt.sign(
            { id_user: user.id_user, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user
        });
    });
};

// Logika untuk LOGOUT (Tetap seperti kode awal Anda)
exports.logout = (req, res) => {
    res.json({ message: "Logout berhasil, sesi dihapus." });
};

