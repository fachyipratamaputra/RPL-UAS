const jwt = require('jsonwebtoken');

// 1. Verifikasi Umum (Apakah User sudah Login?)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak, silakan login terlebih dahulu.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        
        // SINKRONISASI: Menjamin properti id_user terisi
        if (verified.id && !verified.id_user) {
            req.user.id_user = verified.id;
        }
        
        next();
    } catch (error) {
        console.log("JWT Verify Error:", error.message);
        return res.status(401).json({ error: 'Sesi habis atau token tidak valid.' });
    }
};

// 2. Validasi Khusus ADMIN
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.role || req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Akses terlarang! Halaman ini khusus untuk Admin.' });
    }
    next();
};

// 3. Validasi Khusus CUSTOMER
const isCustomer = (req, res, next) => {
    if (!req.user || !req.user.role || req.user.role.toLowerCase() !== 'customer') {
        return res.status(403).json({ error: 'Akses terlarang! Halaman ini khusus untuk Customer.' });
    }
    next();
};

// BAGIAN PALING PENTING YANG BIKIN ERROR:
// Pastikan kurung kurawalnya lengkap agar objek tidak terbaca kosong ({}) lagi!
module.exports = { verifyToken, isAdmin, isCustomer };