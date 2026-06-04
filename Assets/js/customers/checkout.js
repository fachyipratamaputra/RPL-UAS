/**
 * checkout.js - Proses Checkout Customer
 * Terhubung dengan: pages/customer/checkout.html
 * Dependensi: cart.js, localStorage
 */

// ========================================
// CHECKOUT MANAGEMENT SYSTEM
// ========================================

class CheckoutManager {
    constructor() {
        this.cart = window.cart || new ShoppingCart();
        this.init();
    }

    init() {
        this.loadCheckoutData();
        this.bindEvents();
        this.validateCheckout();
    }

    // Load checkout data
    loadCheckoutData() {
        const cart = this.cart.getCart();
        const subtotal = this.cart.calculateSubtotal();
        const shipping = this.cart.calculateShipping();
        const total = this.cart.calculateTotal();

        // Load order summary
        const summaryContainer = document.getElementById('orderSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = this.renderOrderSummary(cart, subtotal, shipping, total);
        }

        // Load saved addresses
        this.loadSavedAddresses();

        // Load user data
        this.loadUserData();
    }

    // Render order summary
    renderOrderSummary(cart, subtotal, shipping, total) {
        if (cart.length === 0) {
            return `
                <div class="summary-card">
                    <h3>Pesanan Anda</h3>
                    <div class="empty-order">
                        <p>Keranjang belanja kosong</p>
                        <a href="products.html" class="btn-primary">Belanja Sekarang</a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="summary-card">
                <h3>Ringkasan Pesanan</h3>
                <div class="order-items">
                    ${cart.map(item => `
                        <div class="order-item">
                            <div class="item-info">
                                <span class="item-name">${item.name}</span>
                                <span class="item-qty">x ${item.quantity}</span>
                            </div>
                            <span class="item-price">Rp ${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>Rp ${subtotal.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Ongkos Kirim</span>
                    <span>${shipping === 0 ? 'GRATIS' : `Rp ${shipping.toLocaleString()}`}</span>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span>Rp ${total.toLocaleString()}</span>
                </div>
                <div class="voucher-section">
                    <input type="text" id="voucherCode" placeholder="Kode Voucher">
                    <button id="applyVoucherBtn" class="btn-voucher">Terapkan</button>
                </div>
                <button id="placeOrderBtn" class="btn-place-order">Buat Pesanan</button>
            </div>
        `;
    }

    // Load saved addresses
    loadSavedAddresses() {
        const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
        const addressSelect = document.getElementById('addressSelect');
        
        if (addressSelect && addresses.length > 0) {
            addressSelect.innerHTML = `
                <option value="">Pilih alamat tersimpan</option>
                ${addresses.map((addr, index) => `
                    <option value="${index}">${addr.label} - ${addr.address}</option>
                `).join('')}
            `;
            
            addressSelect.addEventListener('change', (e) => {
                if (e.target.value !== '') {
                    const addr = addresses[parseInt(e.target.value)];
                    this.fillAddressForm(addr);
                }
            });
        }
    }

    // Fill address form
    fillAddressForm(address) {
        document.getElementById('receiverName').value = address.receiverName || '';
        document.getElementById('address').value = address.address;
        document.getElementById('city').value = address.city;
        document.getElementById('province').value = address.province;
        document.getElementById('postalCode').value = address.postalCode;
        document.getElementById('phone').value = address.phone;
    }

    // Load user data
    loadUserData() {
        const userEmail = localStorage.getItem('userEmail');
        const userFullname = localStorage.getItem('userFullname');
        const userPhone = localStorage.getItem('userPhone');
        
        if (userFullname) document.getElementById('receiverName').value = userFullname;
        if (userPhone) document.getElementById('phone').value = userPhone;
        if (userEmail) document.getElementById('email').value = userEmail;
    }

    // Validate checkout form
    validateCheckout() {
        const requiredFields = ['receiverName', 'address', 'city', 'province', 'postalCode', 'phone'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (input && !input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            } else if (input) {
                input.classList.remove('error');
            }
        });
        
        return isValid;
    }

    // Get selected shipping method
    getShippingMethod() {
        const selected = document.querySelector('input[name="shipping"]:checked');
        if (!selected) return null;
        
        const methods = {
            jne: { name: 'JNE Reguler', price: 20000, estimation: '3-5 hari' },
            tiki: { name: 'TIKI Express', price: 25000, estimation: '2-4 hari' },
            pos: { name: 'POS Indonesia', price: 15000, estimation: '4-7 hari' }
        };
        
        return methods[selected.value] || methods.jne;
    }

    // Get selected payment method
    getPaymentMethod() {
        const selected = document.querySelector('input[name="payment"]:checked');
        if (!selected) return null;
        
        const methods = {
            bank_transfer: 'Transfer Bank',
            credit_card: 'Kartu Kredit',
            ewallet: 'E-Wallet',
            cod: 'COD (Bayar di Tempat)'
        };
        
        return methods[selected.value] || 'Transfer Bank';
    }

    // Place order
    placeOrder() {
        if (!this.validateCheckout()) {
            alert('Harap lengkapi semua data pengiriman!');
            return false;
        }

        const cart = this.cart.getCart();
        if (cart.length === 0) {
            alert('Keranjang belanja kosong!');
            return false;
        }

        const shippingMethod = this.getShippingMethod();
        const paymentMethod = this.getPaymentMethod();
        
        const orderData = {
            orderId: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            orderDate: new Date().toISOString(),
            customer: {
                name: document.getElementById('receiverName').value,
                email: document.getElementById('email')?.value || localStorage.getItem('userEmail'),
                phone: document.getElementById('phone').value
            },
            shipping: {
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                province: document.getElementById('province').value,
                postalCode: document.getElementById('postalCode').value,
                method: shippingMethod,
                notes: document.getElementById('orderNotes')?.value || ''
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color
            })),
            subtotal: this.cart.calculateSubtotal(),
            shippingCost: shippingMethod?.price || 20000,
            discount: this.getActiveDiscount(),
            total: this.cart.calculateTotal(),
            paymentMethod: paymentMethod,
            paymentStatus: 'pending',
            orderStatus: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    date: new Date().toISOString(),
                    note: 'Pesanan dibuat'
                }
            ]
        };

        // Save order
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.unshift(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Save current order for payment
        localStorage.setItem('currentOrder', JSON.stringify(orderData));
        
        // Clear cart
        localStorage.setItem('cart', JSON.stringify([]));
        
        // Clear discount
        localStorage.removeItem('activeDiscount');
        
        // Show success message
        this.showOrderSuccess(orderData);
        
        return true;
    }

    // Get active discount
    getActiveDiscount() {
        const discount = JSON.parse(localStorage.getItem('activeDiscount'));
        if (discount) {
            return {
                code: discount.code,
                amount: discount.amount,
                percentage: discount.percentage
            };
        }
        return null;
    }

    // Show order success
    showOrderSuccess(order) {
        const modal = document.createElement('div');
        modal.className = 'order-success-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Pesanan Berhasil Dibuat!</h2>
                <p>Nomor Pesanan: <strong>${order.orderId}</strong></p>
                <p>Total Pembayaran: <strong>Rp ${order.total.toLocaleString()}</strong></p>
                <p>Silakan lanjutkan ke pembayaran untuk menyelesaikan pesanan Anda.</p>
                <div class="modal-actions">
                    <button id="gotoPaymentBtn" class="btn-primary">Lanjut ke Pembayaran</button>
                    <button id="viewOrderBtn" class="btn-secondary">Lihat Pesanan</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        document.getElementById('gotoPaymentBtn')?.addEventListener('click', () => {
            window.location.href = 'payment.html';
        });
        
        document.getElementById('viewOrderBtn')?.addEventListener('click', () => {
            window.location.href = 'order-history.html';
        });
    }

    // Apply voucher
    applyVoucher() {
        const codeInput = document.getElementById('voucherCode');
        if (!codeInput) return;
        
        const code = codeInput.value.trim().toUpperCase();
        if (!code) {
            alert('Masukkan kode voucher!');
            return;
        }
        
        const success = this.cart.applyDiscount(code);
        if (success) {
            codeInput.value = '';
            this.loadCheckoutData();
        }
    }

    // Bind events
    bindEvents() {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.placeOrder();
            });
        }
        
        const applyVoucherBtn = document.getElementById('applyVoucherBtn');
        if (applyVoucherBtn) {
            applyVoucherBtn.addEventListener('click', () => this.applyVoucher());
        }
        
        // Save address checkbox
        const saveAddressCheckbox = document.getElementById('saveAddress');
        if (saveAddressCheckbox) {
            saveAddressCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.saveCurrentAddress();
                }
            });
        }
        
        // Real-time validation
        const inputs = document.querySelectorAll('#checkoutForm input, #checkoutForm textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.value.trim()) {
                    input.classList.remove('error');
                }
            });
        });
    }

    // Save current address
    saveCurrentAddress() {
        const address = {
            label: document.getElementById('addressLabel')?.value || 'Alamat Baru',
            receiverName: document.getElementById('receiverName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            province: document.getElementById('province').value,
            postalCode: document.getElementById('postalCode').value,
            phone: document.getElementById('phone').value
        };
        
        if (address.receiverName && address.address && address.city) {
            let addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
            addresses.push(address);
            localStorage.setItem('userAddresses', JSON.stringify(addresses));
            alert('Alamat berhasil disimpan!');
        }
    }
}

// ========================================
// INITIALIZE CHECKOUT
// ========================================

let checkoutManager;

document.addEventListener('DOMContentLoaded', () => {
    checkoutManager = new CheckoutManager();
});

// Add CSS
const checkoutStyles = document.createElement('style');
checkoutStyles.textContent = `
    .order-success-modal {
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
    .order-success-modal .modal-content {
        background: white;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 450px;
        width: 90%;
        animation: fadeInUp 0.3s;
    }
    .success-icon i {
        font-size: 80px;
        color: #10b981;
        margin-bottom: 20px;
    }
    .modal-actions {
        display: flex;
        gap: 15px;
        margin-top: 25px;
        justify-content: center;
    }
    .voucher-section {
        display: flex;
        gap: 10px;
        margin: 15px 0;
    }
    .voucher-section input {
        flex: 1;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
    }
    .btn-voucher {
        padding: 10px 20px;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
    }
    .error {
        border-color: #ef4444 !important;
    }
    .order-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f3f4f6;
    }
`;
document.head.appendChild(checkoutStyles);