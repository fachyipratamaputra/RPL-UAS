/**
 * payment.js - Sistem Pembayaran Customer
 * Terhubung dengan: pages/customer/payment.html
 * Dependensi: localStorage
 */

// ========================================
// PAYMENT MANAGEMENT SYSTEM
// ========================================

class PaymentManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadOrderData();
        this.loadPaymentSummary();
        this.bindEvents();
        this.startPaymentTimer();
    }

    // Load order data
    loadOrderData() {
        const currentOrder = JSON.parse(localStorage.getItem('currentOrder'));
        
        if (!currentOrder) {
            this.showError('Tidak ada pesanan yang sedang diproses');
            return;
        }
        
        this.currentOrder = currentOrder;
        this.displayOrderInfo();
    }

    // Display order info
    displayOrderInfo() {
        const orderInfoContainer = document.getElementById('orderInfo');
        if (orderInfoContainer && this.currentOrder) {
            orderInfoContainer.innerHTML = `
                <div class="order-info-card">
                    <div class="order-number">
                        <i class="fas fa-receipt"></i>
                        <span>Nomor Pesanan: <strong>${this.currentOrder.orderId}</strong></span>
                    </div>
                    <div class="order-date">
                        <i class="fas fa-calendar"></i>
                        <span>Tanggal: ${new Date(this.currentOrder.orderDate).toLocaleString()}</span>
                    </div>
                    <div class="payment-deadline">
                        <i class="fas fa-hourglass-half"></i>
                        <span>Sisa waktu pembayaran: <strong id="paymentTimer">23:59:59</strong></span>
                    </div>
                </div>
            `;
        }
    }

    // Load payment summary
    loadPaymentSummary() {
        const summaryContainer = document.getElementById('paymentSummary');
        if (!summaryContainer || !this.currentOrder) return;
        
        summaryContainer.innerHTML = `
            <div class="summary-card">
                <h3>Ringkasan Pembayaran</h3>
                <div class="order-items">
                    ${this.currentOrder.items.map(item => `
                        <div class="payment-item">
                            <div class="item-detail">
                                <span class="item-name">${item.name}</span>
                                <span class="item-qty">x ${item.quantity}</span>
                            </div>
                            <span class="item-price">Rp ${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>Rp ${this.currentOrder.subtotal.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Ongkos Kirim</span>
                    <span>${this.currentOrder.shippingCost === 0 ? 'GRATIS' : `Rp ${this.currentOrder.shippingCost.toLocaleString()}`}</span>
                </div>
                ${this.currentOrder.discount ? `
                    <div class="summary-row discount">
                        <span>Diskon (${this.currentOrder.discount.percentage}%)</span>
                        <span>- Rp ${this.currentOrder.discount.amount.toLocaleString()}</span>
                    </div>
                ` : ''}
                <div class="summary-row total">
                    <span>Total Dibayar</span>
                    <span>Rp ${this.currentOrder.total.toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    // Bind events
    bindEvents() {
        // Payment method selection
        const paymentOptions = document.querySelectorAll('input[name="payment"]');
        paymentOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.showPaymentDetails(e.target.value);
            });
        });
        
        // Pay button
        const payBtn = document.getElementById('payBtn');
        if (payBtn) {
            payBtn.addEventListener('click', () => this.processPayment());
        }
        
        // Virtual account number copy
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accountNumber = e.target.dataset.account;
                if (accountNumber) {
                    navigator.clipboard.writeText(accountNumber);
                    this.showNotification('Nomor rekening disalin!', 'success');
                }
            });
        });
        
        // File upload for manual payment
        const paymentProof = document.getElementById('paymentProof');
        if (paymentProof) {
            paymentProof.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files[0]);
            });
        }
    }

    // Show payment details based on method
    showPaymentDetails(method) {
        const detailsContainer = document.getElementById('paymentDetails');
        if (!detailsContainer) return;
        
        let html = '';
        
        switch(method) {
            case 'bank_transfer':
                html = this.getBankTransferDetails();
                break;
            case 'credit_card':
                html = this.getCreditCardDetails();
                break;
            case 'ewallet':
                html = this.getEWalletDetails();
                break;
            case 'cod':
                html = this.getCODDetails();
                break;
            default:
                html = '';
        }
        
        detailsContainer.innerHTML = html;
        detailsContainer.classList.add('active');
        
        // Bind copy buttons after render
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accountNumber = btn.dataset.account;
                if (accountNumber) {
                    navigator.clipboard.writeText(accountNumber);
                    this.showNotification('Nomor rekening disalin!', 'success');
                }
            });
        });
    }

    // Bank transfer details
    getBankTransferDetails() {
        return `
            <div class="payment-details-card">
                <h4><i class="fas fa-university"></i> Transfer Bank</h4>
                <p>Silakan transfer ke salah satu rekening berikut:</p>
                <div class="bank-list">
                    <div class="bank-item">
                        <div class="bank-info">
                            <strong>Bank BCA</strong>
                            <span>1234567890</span>
                            <span>a.n. Toko Baju Online</span>
                        </div>
                        <button class="copy-btn" data-account="1234567890">Salin</button>
                    </div>
                    <div class="bank-item">
                        <div class="bank-info">
                            <strong>Bank Mandiri</strong>
                            <span>9876543210</span>
                            <span>a.n. Toko Baju Online</span>
                        </div>
                        <button class="copy-btn" data-account="9876543210">Salin</button>
                    </div>
                    <div class="bank-item">
                        <div class="bank-info">
                            <strong>Bank BNI</strong>
                            <span>5555555555</span>
                            <span>a.n. Toko Baju Online</span>
                        </div>
                        <button class="copy-btn" data-account="5555555555">Salin</button>
                    </div>
                </div>
                <div class="payment-instruction">
                    <h5>Petunjuk Transfer:</h5>
                    <ol>
                        <li>Transfer sesuai total tagihan</li>
                        <li>Sertakan kode unik jika ada</li>
                        <li>Upload bukti transfer di bawah</li>
                        <li>Pembayaran akan dikonfirmasi dalam 1x24 jam</li>
                    </ol>
                </div>
                <div class="upload-proof">
                    <label>Upload Bukti Transfer</label>
                    <input type="file" id="paymentProof" accept="image/*,.pdf">
                    <small>Format: JPG, PNG, PDF (Max 2MB)</small>
                </div>
            </div>
        `;
    }

    // Credit card details
    getCreditCardDetails() {
        return `
            <div class="payment-details-card">
                <h4><i class="fas fa-credit-card"></i> Kartu Kredit</h4>
                <div class="credit-card-form">
                    <div class="form-group">
                        <label>Nomor Kartu</label>
                        <input type="text" placeholder="1234 5678 9012 3456" id="cardNumber">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Expiry Date</label>
                            <input type="text" placeholder="MM/YY" id="expiryDate">
                        </div>
                        <div class="form-group">
                            <label>CVV</label>
                            <input type="text" placeholder="123" id="cvv">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Nama Pemilik</label>
                        <input type="text" placeholder="NAMA SESUAI KARTU" id="cardName">
                    </div>
                    <button id="processCardBtn" class="btn-pay">Proses Pembayaran</button>
                </div>
            </div>
        `;
    }

    // E-Wallet details
    getEWalletDetails() {
        return `
            <div class="payment-details-card">
                <h4><i class="fas fa-mobile-alt"></i> E-Wallet</h4>
                <p>Pilih E-Wallet Anda:</p>
                <div class="ewallet-options">
                    <label class="ewallet-option">
                        <input type="radio" name="ewallet" value="ovo">
                        <img src="https://via.placeholder.com/60x30/4F46E5/FFFFFF?text=OVO" alt="OVO">
                        <span>OVO</span>
                    </label>
                    <label class="ewallet-option">
                        <input type="radio" name="ewallet" value="gopay">
                        <img src="https://via.placeholder.com/60x30/4F46E5/FFFFFF?text=GoPay" alt="GoPay">
                        <span>GoPay</span>
                    </label>
                    <label class="ewallet-option">
                        <input type="radio" name="ewallet" value="dana">
                        <img src="https://via.placeholder.com/60x30/4F46E5/FFFFFF?text=DANA" alt="DANA">
                        <span>DANA</span>
                    </label>
                </div>
                <div class="phone-input">
                    <label>Nomor HP Terdaftar</label>
                    <input type="tel" placeholder="081234567890" id="ewalletPhone">
                </div>
                <button id="processEwalletBtn" class="btn-pay">Bayar dengan E-Wallet</button>
            </div>
        `;
    }

    // COD details
    getCODDetails() {
        return `
            <div class="payment-details-card">
                <h4><i class="fas fa-truck"></i> Bayar di Tempat (COD)</h4>
                <div class="cod-info">
                    <div class="info-box">
                        <i class="fas fa-info-circle"></i>
                        <p>Anda memilih metode pembayaran COD (Cash on Delivery)</p>
                    </div>
                    <div class="cod-requirements">
                        <h5>Persyaratan COD:</h5>
                        <ul>
                            <li>Maksimal pesanan Rp 500.000</li>
                            <li>Siapkan uang pas saat pengiriman</li>
                            <li>Pastikan alamat dapat dihubungi</li>
                        </ul>
                    </div>
                    <button id="confirmCodBtn" class="btn-pay">Konfirmasi Pesanan COD</button>
                </div>
            </div>
        `;
    }

    // Process payment
    async processPayment() {
        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (!selectedPayment) {
            this.showNotification('Pilih metode pembayaran terlebih dahulu!', 'error');
            return;
        }
        
        const method = selectedPayment.value;
        let paymentSuccess = false;
        
        switch(method) {
            case 'bank_transfer':
                paymentSuccess = await this.processBankTransfer();
                break;
            case 'credit_card':
                paymentSuccess = await this.processCreditCard();
                break;
            case 'ewallet':
                paymentSuccess = await this.processEWallet();
                break;
            case 'cod':
                paymentSuccess = await this.processCOD();
                break;
            default:
                paymentSuccess = false;
        }
        
        if (paymentSuccess) {
            this.finalizePayment(method);
        }
    }

    // Process bank transfer
    async processBankTransfer() {
        const fileInput = document.getElementById('paymentProof');
        if (!fileInput || !fileInput.files[0]) {
            this.showNotification('Upload bukti transfer terlebih dahulu!', 'error');
            return false;
        }
        
        // Simulate upload
        this.showNotification('Memproses bukti transfer...', 'info');
        await this.delay(1500);
        
        return true;
    }

    // Process credit card
    async processCreditCard() {
        const cardNumber = document.getElementById('cardNumber')?.value;
        const expiryDate = document.getElementById('expiryDate')?.value;
        const cvv = document.getElementById('cvv')?.value;
        const cardName = document.getElementById('cardName')?.value;
        
        if (!cardNumber || !expiryDate || !cvv || !cardName) {
            this.showNotification('Lengkapi data kartu kredit!', 'error');
            return false;
        }
        
        // Validate card number (simple validation)
        if (cardNumber.replace(/\s/g, '').length < 16) {
            this.showNotification('Nomor kartu tidak valid!', 'error');
            return false;
        }
        
        // Simulate payment processing
        this.showNotification('Memproses pembayaran...', 'info');
        await this.delay(2000);
        
        return true;
    }

    // Process E-Wallet
    async processEWallet() {
        const selectedEwallet = document.querySelector('input[name="ewallet"]:checked');
        const phone = document.getElementById('ewalletPhone')?.value;
        
        if (!selectedEwallet) {
            this.showNotification('Pilih E-Wallet!', 'error');
            return false;
        }
        
        if (!phone || phone.length < 10) {
            this.showNotification('Nomor HP tidak valid!', 'error');
            return false;
        }
        
        // Simulate payment
        this.showNotification('Mengalihkan ke aplikasi E-Wallet...', 'info');
        await this.delay(1500);
        
        return true;
    }

    // Process COD
    async processCOD() {
        const confirmed = confirm('Konfirmasi pesanan dengan metode COD?');
        if (!confirmed) return false;
        
        this.showNotification('Memproses pesanan COD...', 'info');
        await this.delay(1000);
        
        return true;
    }

    // Finalize payment
    finalizePayment(method) {
        // Update order status
        if (this.currentOrder) {
            this.currentOrder.paymentMethod = this.getPaymentMethodName(method);
            this.currentOrder.paymentStatus = 'paid';
            this.currentOrder.orderStatus = 'processing';
            this.currentOrder.statusHistory.push({
                status: 'processing',
                date: new Date().toISOString(),
                note: 'Pembayaran berhasil dikonfirmasi'
            });
            
            // Save to orders
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            const orderIndex = orders.findIndex(o => o.orderId === this.currentOrder.orderId);
            if (orderIndex !== -1) {
                orders[orderIndex] = this.currentOrder;
            } else {
                orders.push(this.currentOrder);
            }
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Clear current order
            localStorage.removeItem('currentOrder');
            
            // Show success
            this.showPaymentSuccess();
        }
    }

    // Show payment success
    showPaymentSuccess() {
        const modal = document.createElement('div');
        modal.className = 'payment-success-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Pembayaran Berhasil!</h2>
                <p>Pesanan Anda telah kami terima dan sedang diproses.</p>
                <p>Nomor Pesanan: <strong>${this.currentOrder?.orderId}</strong></p>
                <div class="modal-actions">
                    <button id="viewOrderBtn" class="btn-primary">Lihat Pesanan Saya</button>
                    <button id="continueShoppingBtn" class="btn-secondary">Lanjutkan Belanja</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        document.getElementById('viewOrderBtn')?.addEventListener('click', () => {
            window.location.href = 'order-history.html';
        });
        
        document.getElementById('continueShoppingBtn')?.addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    // Helper methods
    getPaymentMethodName(method) {
        const methods = {
            bank_transfer: 'Transfer Bank',
            credit_card: 'Kartu Kredit',
            ewallet: 'E-Wallet',
            cod: 'COD (Bayar di Tempat)'
        };
        return methods[method] || method;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `payment-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'payment-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="window.location.href='cart.html'">Kembali ke Keranjang</button>
        `;
        document.querySelector('.payment-main')?.prepend(errorDiv);
    }

    startPaymentTimer() {
        // Set 24 hours deadline
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 24);
        
        const timerElement = document.getElementById('paymentTimer');
        if (!timerElement) return;
        
        const updateTimer = () => {
            const now = new Date();
            const diff = deadline - now;
            
            if (diff <= 0) {
                clearInterval(timerInterval);
                timerElement.textContent = '00:00:00';
                this.showNotification('Waktu pembayaran habis! Pesanan dibatalkan.', 'error');
                this.cancelOrder();
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };
        
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
    }

    cancelOrder() {
        if (this.currentOrder) {
            this.currentOrder.orderStatus = 'cancelled';
            this.currentOrder.statusHistory.push({
                status: 'cancelled',
                date: new Date().toISOString(),
                note: 'Pesanan dibatalkan karena melebihi batas waktu pembayaran'
            });
            
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            const orderIndex = orders.findIndex(o => o.orderId === this.currentOrder.orderId);
            if (orderIndex !== -1) {
                orders[orderIndex] = this.currentOrder;
                localStorage.setItem('orders', JSON.stringify(orders));
            }
            
            localStorage.removeItem('currentOrder');
        }
    }

    handleFileUpload(file) {
        if (!file) return;
        
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        
        if (file.size > maxSize) {
            this.showNotification('File terlalu besar! Maksimal 2MB', 'error');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Format file tidak didukung! Gunakan JPG, PNG, atau PDF', 'error');
            return false;
        }
        
        this.showNotification('File berhasil diupload', 'success');
        return true;
    }
}

// ========================================
// INITIALIZE PAYMENT
// ========================================

let paymentManager;

document.addEventListener('DOMContentLoaded', () => {
    paymentManager = new PaymentManager();
});

// Add CSS
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
    .payment-notification, .payment-error {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s;
    }
    .payment-notification.show {
        transform: translateX(0);
    }
    .payment-notification.success {
        background: #d1fae5;
        color: #059669;
    }
    .payment-notification.error {
        background: #fee2e2;
        color: #dc2626;
    }
    .payment-notification.info {
        background: #dbeafe;
        color: #2563eb;
    }
    .payment-success-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    .payment-success-modal .modal-content {
        background: white;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 450px;
        width: 90%;
    }
    .payment-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #f3f4f6;
    }
    .bank-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 15px 0;
    }
    .bank-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
    }
    .copy-btn {
        padding: 5px 15px;
        background: #4F46E5;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    }
    .ewallet-options {
        display: flex;
        gap: 15px;
        margin: 15px 0;
    }
    .ewallet-option {
        flex: 1;
        text-align: center;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
    }
    .order-info-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 15px;
    }
`;
document.head.appendChild(paymentStyles);