// konfigurasi database
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password: '',
    database: 'toko_baju'
});

db.connect((err) => {
    if (err) {
        console.error('MySql COnnection Error:', err.message);
        return;
    }
    console.log('Database Toko Baju Online terkoneksi');
});

module.exports = db;