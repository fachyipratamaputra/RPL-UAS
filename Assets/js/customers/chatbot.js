/**
 * chatbot.js - Chatbot Customer untuk Toko Baju Online
 * Terhubung dengan: pages/customer/chatbot.html, components/chatbot-widget.html
 * Dependensi: DOM manipulation, localStorage
 */

// ========================================
// CHATBOT MANAGEMENT SYSTEM
// ========================================

class Chatbot {
    constructor(options = {}) {
        this.options = {
            containerId: options.containerId || 'chatbotMessages',
            inputId: options.inputId || 'chatbotInput',
            sendBtnId: options.sendBtnId || 'sendBtn',
            quickRepliesId: options.quickRepliesId || 'quickReplies',
            isWidget: options.isWidget || false
        };
        
        this.messages = [];
        this.isTyping = false;
        this.conversationContext = {};
        this.init();
    }

    init() {
        this.loadMessages();
        this.bindEvents();
        this.setupWelcomeMessage();
    }

    // Load messages from localStorage
    loadMessages() {
        const saved = localStorage.getItem('chatbotMessages');
        if (saved) {
            this.messages = JSON.parse(saved);
            this.renderMessages();
        }
    }

    // Save messages to localStorage
    saveMessages() {
        // Keep only last 50 messages
        if (this.messages.length > 50) {
            this.messages = this.messages.slice(-50);
        }
        localStorage.setItem('chatbotMessages', JSON.stringify(this.messages));
    }

    // Bind events
    bindEvents() {
        // Send button
        const sendBtn = document.getElementById(this.options.sendBtnId);
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendUserMessage());
        }
        
        // Enter key
        const input = document.getElementById(this.options.inputId);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendUserMessage();
                }
            });
        }
        
        // Clear button
        const clearBtn = document.getElementById('clearChatBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearChat());
        }
    }

    // Setup welcome message
    setupWelcomeMessage() {
        if (this.messages.length === 0) {
            this.addBotMessage(`
                Halo! 👋 Selamat datang di Toko Baju Online!
                
                Saya asisten virtual siap membantu Anda. Silakan tanyakan:
                • 🛍️ Informasi produk
                • 📦 Status pesanan
                • 🚚 Info pengiriman
                • 📏 Panduan ukuran
                • 🏷️ Promo & diskon
                • 💳 Metode pembayaran
                • 🔄 Return & garansi
                • 📞 Kontak customer service
                
                Ada yang bisa saya bantu hari ini?
            `);
        }
    }

    // Send user message
    async sendUserMessage() {
        const input = document.getElementById(this.options.inputId);
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addUserMessage(message);
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Process and get response
        setTimeout(async () => {
            this.hideTypingIndicator();
            const response = await this.getBotResponse(message);
            this.addBotMessage(response);
        }, 500 + Math.random() * 500);
    }

    // Add user message
    addUserMessage(text) {
        const message = {
            id: Date.now(),
            type: 'user',
            text: text,
            timestamp: new Date().toISOString()
        };
        this.messages.push(message);
        this.saveMessages();
        this.renderMessage(message);
    }

    // Add bot message
    addBotMessage(text) {
        const message = {
            id: Date.now(),
            type: 'bot',
            text: text,
            timestamp: new Date().toISOString()
        };
        this.messages.push(message);
        this.saveMessages();
        this.renderMessage(message);
    }

    // Render all messages
    renderMessages() {
        const container = document.getElementById(this.options.containerId);
        if (!container) return;
        
        container.innerHTML = '';
        this.messages.forEach(msg => this.renderMessage(msg));
        this.scrollToBottom();
    }

    // Render single message
    renderMessage(message) {
        const container = document.getElementById(this.options.containerId);
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        messageDiv.id = `msg-${message.id}`;
        
        if (message.type === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">${this.formatMessage(message.text)}</div>
                    <div class="message-time">${this.formatTime(message.timestamp)}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                    <div class="message-time">${this.formatTime(message.timestamp)}</div>
                </div>
            `;
        }
        
        container.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // Show typing indicator
    showTypingIndicator() {
        const container = document.getElementById(this.options.containerId);
        if (!container) return;
        
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        container.appendChild(typingDiv);
        this.scrollToBottom();
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
        this.isTyping = false;
    }

    // Get bot response based on user input
    async getBotResponse(message) {
        const lowerMsg = message.toLowerCase();
        
        // Product information
        if (lowerMsg.match(/produk|product|barang|belanja|lihat/)) {
            return this.getProductResponse(lowerMsg);
        }
        
        // Order status
        else if (lowerMsg.match(/pesanan|order|status|cek|tracking/)) {
            return this.getOrderResponse(lowerMsg);
        }
        
        // Shipping info
        else if (lowerMsg.match(/pengiriman|ongkir|shipping|kurir|delivery/)) {
            return this.getShippingResponse(lowerMsg);
        }
        
        // Size guide
        else if (lowerMsg.match(/ukuran|size|sizing|panduan|fit/)) {
            return this.getSizeGuideResponse();
        }
        
        // Promo & discount
        else if (lowerMsg.match(/promo|diskon|voucher|kode|discount|coupon/)) {
            return this.getPromoResponse();
        }
        
        // Payment methods
        else if (lowerMsg.match(/bayar|payment|pembayaran|transfer|kartu|ewallet|cod/)) {
            return this.getPaymentResponse();
        }
        
        // Return policy
        else if (lowerMsg.match(/return|pengembalian|garansi|tukar|refund/)) {
            return this.getReturnResponse();
        }
        
        // Contact info
        else if (lowerMsg.match(/kontak|cs|customer service|bantuan|help|wa|telepon|email/)) {
            return this.getContactResponse();
        }
        
        // FAQ
        else if (lowerMsg.match(/faq|tanya|pertanyaan|bagaimana|cara/)) {
            return this.getFAQResponse();
        }
        
        // Greeting
        else if (lowerMsg.match(/halo|hai|hi|hello|selamat pagi|selamat siang|selamat malam/)) {
            return this.getGreetingResponse();
        }
        
        // Thank you
        else if (lowerMsg.match(/terima kasih|thank|makasih|thanks/)) {
            return "Sama-sama! 😊 Senang bisa membantu Anda. Ada lagi yang bisa saya bantu?";
        }
        
        // Default response
        else {
            return this.getDefaultResponse();
        }
    }

    // Get product response
    getProductResponse(query) {
        const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        
        if (query.match(/rekomendasi|rekomendasi produk|rekomendasi produk terbaru/)) {
            const topProducts = products.slice(0, 3);
            return `
                Berikut rekomendasi produk terbaru kami:
                
                ${topProducts.map(p => `• ${p.name} - Rp ${p.price.toLocaleString()}`).join('\n')}
                
                Lihat selengkapnya di halaman produk ya!
                <a href="../customer/products.html" class="chat-link">Lihat Semua Produk →</a>
            `;
        }
        
        if (query.match(/harga|price/)) {
            return `
                Harga produk kami mulai dari Rp 50.000 hingga Rp 500.000.
                
                Untuk informasi harga spesifik, silakan kunjungi halaman produk atau sebutkan nama produk yang ingin Anda cari!
                
                <a href="../customer/products.html" class="chat-link">Lihat Semua Produk</a>
            `;
        }
        
        if (query.match(/kategori|category/)) {
            return `
                Kami memiliki beberapa kategori produk:
                👕 Pakaian Pria
                👗 Pakaian Wanita  
                👶 Pakaian Anak
                💍 Aksesoris
                
                Kategori mana yang ingin Anda lihat?
            `;
        }
        
        return `
            🛍️ <strong>Informasi Produk</strong>
            
            Kami menyediakan berbagai koleksi fashion:
            • Kaos, kemeja, jaket
            • Dress, rok, blouse
            • Baju anak, celana anak
            • Topi, tas, aksesoris
            
            Fitur yang tersedia:
            • Filter berdasarkan kategori, ukuran, warna
            • Sorting harga termurah/termahal
            • Detail produk lengkap dengan gambar
            
            Apakah Anda ingin mencari produk tertentu?
            <a href="../customer/products.html" class="chat-link">Kunjungi Halaman Produk →</a>
        `;
    }

    // Get order response
    getOrderResponse(query) {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            return `
                Untuk mengecek status pesanan, Anda perlu login terlebih dahulu.
                
                <a href="../customer/login.html" class="chat-link">Login Sekarang →</a>
                
                Belum punya akun? <a href="../customer/register.html" class="chat-link">Daftar di sini</a>
            `;
        }
        
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const userOrders = orders.filter(o => o.customer?.email === localStorage.getItem('userEmail'));
        
        if (userOrders.length === 0) {
            return `
                📦 Anda belum memiliki pesanan.
                
                Yuk, mulai belanja sekarang!
                <a href="../customer/products.html" class="chat-link">Belanja Sekarang →</a>
            `;
        }
        
        if (query.match(/terbaru|latest/)) {
            const latestOrder = userOrders[0];
            return `
                📦 <strong>Pesanan Terbaru Anda</strong>
                
                Nomor Pesanan: ${latestOrder.orderId}
                Status: ${this.getOrderStatusText(latestOrder.orderStatus)}
                Total: Rp ${latestOrder.total?.toLocaleString()}
                
                <a href="../customer/order-history.html" class="chat-link">Lihat Detail Pesanan →</a>
            `;
        }
        
        return `
            📦 <strong>Status Pesanan Anda</strong>
            
            Anda memiliki ${userOrders.length} pesanan.
            
            Status pesanan:
            ${userOrders.slice(0, 3).map(o => `• ${o.orderId} - ${this.getOrderStatusText(o.orderStatus)}`).join('\n')}
            
            <a href="../customer/order-history.html" class="chat-link">Lihat Semua Pesanan →</a>
        `;
    }

    // Get shipping response
    getShippingResponse(query) {
        if (query.match(/ongkir|ongkos|biaya/)) {
            return `
                🚚 <strong>Informasi Ongkos Kirim</strong>
                
                • JNE Reguler: Rp 20.000 (3-5 hari)
                • TIKI Express: Rp 25.000 (2-4 hari)
                • POS Indonesia: Rp 15.000 (4-7 hari)
                
                ✨ <strong>Gratis Ongkir</strong> untuk pembelian minimal Rp 200.000!
                
                *Ongkir dapat berbeda sesuai lokasi
            `;
        }
        
        if (query.match(/lama|estimasi|hari/)) {
            return `
                ⏱️ <strong>Estimasi Pengiriman</strong>
                
                • Jabodetabek: 1-3 hari
                • Jawa & Bali: 2-4 hari
                • Luar Jawa: 4-7 hari
                • Luar Pulau: 7-14 hari
                
                Estimasi dihitung setelah pesanan diproses (1x24 jam).
            `;
        }
        
        if (query.match(/lacak|tracking|track|where/)) {
            return `
                🔍 <strong>Lacak Pengiriman</strong>
                
                Untuk melacak pengiriman:
                1. Buka halaman Riwayat Pesanan
                2. Klik "Lacak Pesanan" pada pesanan yang ingin dilacak
                3. Masukkan nomor resi yang dikirim via email/WhatsApp
                
                <a href="../customer/order-history.html" class="chat-link">Lacak Pesanan →</a>
            `;
        }
        
        return `
            🚚 <strong>Informasi Pengiriman</strong>
            
            Kami melayani pengiriman ke seluruh Indonesia.
            
            Yang ingin Anda ketahui:
            • Biaya ongkos kirim
            • Estimasi waktu pengiriman
            • Cara melacak pesanan
            • Wilayah pengiriman
            
            Silakan tanyakan lebih spesifik!
        `;
    }

    // Get size guide response
    getSizeGuideResponse() {
        return `
            📏 <strong>Panduan Ukuran (Lingkar Dada)</strong>
            
            • XS: 80-84 cm
            • S: 84-88 cm
            • M: 88-92 cm
            • L: 92-96 cm
            • XL: 96-100 cm
            • XXL: 100-104 cm
            
            💡 <strong>Tips Memilih Ukuran:</strong>
            • Jika di antara dua ukuran, pilih yang lebih besar
            • Bahan katun biasanya menyusut 2-3%
            • Cek size chart detail di setiap produk
            
            Ada yang ingin ditanyakan tentang ukuran tertentu?
        `;
    }

    // Get promo response
    getPromoResponse() {
        const discounts = JSON.parse(localStorage.getItem('discounts')) || [];
        const activePromos = discounts.filter(d => d.active && d.endDate >= new Date().toISOString().split('T')[0]);
        
        if (activePromos.length > 0) {
            return `
                🏷️ <strong>Promo Aktif!</strong>
                
                ${activePromos.map(p => `• ${p.name}: ${p.discount}% OFF (Min. belanja Rp ${p.minPurchase.toLocaleString()})`).join('\n')}
                
                🎉 <strong>Promo Spesial!</strong>
                • Diskon 20% untuk pembelian pertama dengan kode: <strong>BAJU20</strong>
                • Gratis ongkir min. belanja Rp 200.000
                
                <a href="../customer/products.html" class="chat-link">Lihat Koleksi →</a>
            `;
        }
        
        return `
            🏷️ <strong>Promo & Diskon</strong>
            
            🎉 Promo Aktif:
            • Diskon 20% untuk pembelian pertama (kode: BAJU20)
            • Gratis ongkir min. belanja Rp 200.000
            • Diskon up to 50% untuk koleksi terbaru
            
            💡 <strong>Cara Menggunakan:</strong>
            • Masukkan kode promo saat checkout
            • Diskon otomatis untuk produk tertentu
            • Cek halaman promo untuk info lengkap
            
            <a href="../customer/products.html" class="chat-link">Belanja Sekarang →</a>
        `;
    }

    // Get payment response
    getPaymentResponse() {
        return `
            💳 <strong>Metode Pembayaran</strong>
            
            Kami menerima berbagai metode pembayaran:
            
            🏦 <strong>Bank Transfer</strong>
            • BCA, Mandiri, BNI, BRI
            
            💳 <strong>Kartu Kredit</strong>
            • Visa, Mastercard
            
            📱 <strong>E-Wallet</strong>
            • OVO, GoPay, DANA, ShopeePay
            
            🚚 <strong>COD (Cash on Delivery)</strong>
            • Bayar saat barang diterima
            • Maksimal pesanan Rp 500.000
            
            🔒 Pembayaran 100% aman!
            
            Metode pembayaran apa yang ingin Anda gunakan?
        `;
    }

    // Get return response
    getReturnResponse() {
        return `
            🔄 <strong>Kebijakan Return & Garansi</strong>
            
            ✅ <strong>Garansi Return 14 Hari</strong>
            
            <strong>Syarat & Ketentuan:</strong>
            • Barang belum pernah dipakai
            • Tag/label masih terpasang
            • Kondisi barang baik
            • Menyertakan bukti pembelian
            
            <strong>Cara Return:</strong>
            1. Hubungi CS melalui WhatsApp
            2. Sertakan foto barang dan invoice
            3. Ikuti instruksi dari CS
            4. Barang akan dijemput kurir
            
            ❌ <strong>Tidak Dapat Return:</strong>
            • Barang sudah dicuci
            • Barang rusak karena pemakaian
            • Barang clearance sale
            
            Ada yang ingin ditanyakan tentang return?
        `;
    }

    // Get contact response
    getContactResponse() {
        return `
            📞 <strong>Hubungi Customer Service</strong>
            
            🕐 <strong>Jam Operasional:</strong>
            Senin-Minggu, 08:00 - 21:00 WIB
            
            📱 <strong>WhatsApp:</strong>
            0812-3456-7890 (Fast Response)
            
            📧 <strong>Email:</strong>
            cs@tokobaju.com
            
            📞 <strong>Telepon:</strong>
            (021) 12345678
            
            💬 <strong>Live Chat:</strong>
            Klik ikon chat di pojok kanan bawah
            
            Kami siap membantu Anda! 🌟
        `;
    }

    // Get FAQ response
    getFAQResponse() {
        return `
            ❓ <strong>Pertanyaan yang Sering Diajukan</strong>
            
            🔸 <strong>Bagaimana cara order?</strong>
            1. Pilih produk
            2. Tambah ke keranjang
            3. Checkout
            4. Isi data pengiriman
            5. Pilih pembayaran
            6. Selesaikan pembayaran
            
            🔸 <strong>Berapa lama pengiriman?</strong>
            1-7 hari tergantung lokasi
            
            🔸 <strong>Apakah bisa COD?</strong>
            Ya, untuk area Jabodetabek & kota besar
            
            🔸 <strong>Bagaimana cara return?</strong>
            Hubungi CS dalam 14 hari
            
            🔸 <strong>Apakah ada garansi?</strong>
            Garansi return 14 hari
            
            Masih ada pertanyaan? Tanyakan langsung ya!
        `;
    }

    // Get greeting response
    getGreetingResponse() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) greeting = 'Selamat pagi';
        else if (hour < 18) greeting = 'Selamat siang';
        else greeting = 'Selamat malam';
        
        return `
            ${greeting}! 👋
            
            Selamat datang di Toko Baju Online.
            
            Saya asisten virtual siap membantu Anda.
            
            Ada yang bisa saya bantu hari ini?
            
            Beberapa topik yang bisa saya bantu:
            🛍️ Info Produk
            📦 Cek Pesanan
            🚚 Info Pengiriman
            📏 Panduan Ukuran
            🏷️ Promo
            💳 Pembayaran
        `;
    }

    // Get default response
    getDefaultResponse() {
        return `
            Maaf, saya belum mengerti pertanyaan Anda 😅
            
            Coba tanyakan dengan kata kunci seperti:
            • "Lihat produk"
            • "Cek pesanan"
            • "Info pengiriman"
            • "Panduan ukuran"
            • "Promo"
            • "Metode pembayaran"
            • "Hubungi CS"
            
            Atau klik tombol quick reply di bawah!
        `;
    }

    // Helper: Get order status text
    getOrderStatusText(status) {
        const statusMap = {
            'pending': '⏳ Menunggu Pembayaran',
            'processing': '🔄 Diproses',
            'shipped': '🚚 Dikirim',
            'delivered': '✅ Selesai',
            'cancelled': '❌ Dibatalkan'
        };
        return statusMap[status] || status;
    }

    // Helper: Format message (support links and line breaks)
    formatMessage(text) {
        // Convert line breaks to <br>
        let formatted = text.replace(/\n/g, '<br>');
        
        // Convert links
        formatted = formatted.replace(/<a href="([^"]+)" class="chat-link">([^<]+)<\/a>/g, 
            '<a href="$1" class="chat-link" target="_blank">$2</a>');
        
        // Convert bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        return formatted;
    }

    // Helper: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper: Format time
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Baru saja';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
        
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    // Helper: Scroll to bottom
    scrollToBottom() {
        const container = document.getElementById(this.options.containerId);
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Clear chat history
    clearChat() {
        if (confirm('Hapus semua percakapan?')) {
            this.messages = [];
            this.saveMessages();
            this.renderMessages();
            this.setupWelcomeMessage();
        }
    }

    // Send quick reply
    sendQuickReply(message) {
        this.addUserMessage(message);
        this.showTypingIndicator();
        
        setTimeout(async () => {
            this.hideTypingIndicator();
            const response = await this.getBotResponse(message);
            this.addBotMessage(response);
        }, 500);
    }
}

// ========================================
// INITIALIZE CHATBOT
// ========================================

let chatbot;

// For main chatbot page
if (document.getElementById('chatbotMessages')) {
    document.addEventListener('DOMContentLoaded', () => {
        chatbot = new Chatbot({
            containerId: 'chatbotMessages',
            inputId: 'chatbotInput',
            sendBtnId: 'sendBtn',
            quickRepliesId: 'quickReplies'
        });
        
        // Setup quick replies
        const quickReplies = document.querySelectorAll('.quick-reply-btn');
        quickReplies.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message;
                if (message && chatbot) {
                    chatbot.sendQuickReply(message);
                }
            });
        });
    });
}

// For widget
if (document.getElementById('chatbotWidget')) {
    document.addEventListener('DOMContentLoaded', () => {
        chatbot = new Chatbot({
            containerId: 'chatbotMessages',
            inputId: 'chatbotInput',
            sendBtnId: 'sendBtn',
            isWidget: true
        });
    });
}

// Export for global use
window.Chatbot = Chatbot;

// Add CSS for chatbot styling
const chatbotStyles = document.createElement('style');
chatbotStyles.textContent = `
    .chat-link {
        display: inline-block;
        color: #4F46E5;
        text-decoration: none;
        margin-top: 8px;
        font-weight: 500;
    }
    .chat-link:hover {
        text-decoration: underline;
    }
    .typing-dots {
        display: flex;
        gap: 5px;
        padding: 8px 12px;
    }
    .typing-dots span {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: typingAnimation 1.4s infinite;
    }
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    @keyframes typingAnimation {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-10px); opacity: 1; }
    }
`;
document.head.appendChild(chatbotStyles);