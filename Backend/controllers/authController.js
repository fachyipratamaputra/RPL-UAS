const db = require('../config/db');
const bcrypt = require('bcryptjs');



// Logika untuk SIGNUP
exports.signup = async (req, res) => {
    try {
        const { nama, email, password, role } = req.body;
        const userRole = role || 'Customer'; //Default

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
                    message: "Registrasi akun berhasil lewat!", 
                    user: { id_user: result.insertId, nama, email, role: userRole } 
                });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Logika untuk LOGIN
exports.login = (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "Akun tidak ditemukan!" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Password salah!" });

        res.json({
            message: "Login berhasil!",
            user: { id_user: user.id_user, nama: user.nama, role: user.role }
        });
    });
};

// Logika untuk LOGOUT
exports.logout = (req, res) => {
    res.json({ message: "Logout berhasil, sesi dihapus." });
};