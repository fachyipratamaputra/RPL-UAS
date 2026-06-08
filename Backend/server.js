const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 5000;


// Import Route yang tadi kita buat
const authRoutes = require('./routes/authRoutes');
const produkRoutes = require('./routes/produkRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frondend')));

// Hubungkan Route ke base path /api/auth
// Artinya semua rute di dalam authRoutes otomatis diawali dengan /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/produk', produkRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.listen(PORT, () => {
    console.log(`Server Toko Baju running di http://localhost:${PORT}`);
});