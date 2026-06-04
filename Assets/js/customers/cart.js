/**
 * cart.js - Keranjang Belanja Customer
 * Terhubung dengan: pages/customer/cart.html, product-detail.html, products.html
 * Dependensi: localStorage, DOM manipulation
 */

// ========================================
// CART MANAGEMENT SYSTEM
// ========================================

class ShoppingCart {
    constructor() {
        this.cartKey = 'cart';
        this.init();
    }

    // Initialize cart
    init() {
        if (!localStorage.getItem(this.cartKey)) {
            localStorage.setItem(this.cartKey, JSON.stringify([]));
        }
        this.updateCartCount();
        this.renderCart();
    }

    // Get cart items
    getCart() {
        return JSON.parse(localStorage.getItem(this.cartKey)) || [];
    }

    // Save cart
    saveCart(cart) {
        localStorage.setItem(this.cartKey, JSON.stringify(cart));
        this.updateCartCount();
        this.renderCart();
        this.dispatchCartEvent();
    }

    // Add to cart
    addToCart(productId, productName, productPrice, quantity = 1, size = null, color = null) {
        let cart = this.getCart();
        const existingItem = cart.find(item => 
            item.id === productId && 
            item.size === size && 
            item.color === color
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                quantity: quantity,
                size: size,
                color: color,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart(cart);
        this.showNotification(`${productName} ditambahkan ke keranjang!`, 'success');
    }

    // Update quantity
    updateQuantity(index, newQuantity) {
        if (newQuantity < 1) return;
        let cart = this.getCart();
        if (cart[index]) {
            cart[index].quantity = newQuantity;
            this.saveCart(cart);
        }
    }

    // Remove item
    removeItem(index) {
        let cart = this.getCart();
        const removedItem = cart[index];
        if (confirm(`Hapus ${removedItem.name} dari keranjang?`)) {
            cart.splice(index, 1);
            this.saveCart(cart);
            this.showNotification(`${removedItem.name} dihapus dari keranjang`, 'info');
        }
    }

    // Clear all cart
    clearCart() {
        if (confirm('Hapus semua item dari keranjang?')) {
            this.saveCart([]);
            this.showNotification('Keranjang dikosongkan', 'info');
        }
    }

    // Calculate subtotal
    calculateSubtotal() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Calculate shipping
    calculateShipping() {
        const subtotal = this.calculateSubtotal();
        return subtotal > 200000 ? 0 : 20000;
    }

    // Calculate total
    calculateTotal() {
        return this.calculateSubtotal() + this.calculateShipping();
    }

    // Update cart count in navbar
    updateCartCount() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(el => {
            if (el) {
                el.textContent = totalItems;
                el.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        });
    }

    // Render cart on cart page
    renderCart() {
        const cartContainer = document.getElementById('cartItems');
        const summaryContainer = document.getElementById('cartSummary');
        
        if (!cartContainer) return;

        const cart = this.getCart();
        
        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Keranjang Belanja Kosong</h3>
                    <p>Yuk, mulai belanja sekarang!</p>
                    <a href="../customer/products.html" class="btn-primary">Mulai Belanja</a>
                </div>
            `;
            if (summaryContainer) summaryContainer.innerHTML = '';
            return;
        }

        // Render cart items
        cartContainer.innerHTML = `
            <div class="cart-header">
                <div>Produk</div>
                <div>Harga</div>
                <div>Jumlah</div>
                <div>Total</div>
                <div></div>
            </div>
            ${cart.map((item, index) => `
                <div class="cart-item" data-index="${index}">
                    <div class="item-info">
                        <div class="item-details">
                            <h3>${item.name}</h3>
                            <div class="item-price">Rp ${item.price.toLocaleString()}</div>
                            ${item.size ? `<div class="item-size">Ukuran: ${item.size}</div>` : ''}
                            ${item.color ? `<div class="item-color">Warna: ${item.color}</div>` : ''}
                        </div>
                    </div>
                    <div class="item-price-display">Rp ${item.price.toLocaleString()}</div>
                    <div class="item-quantity">
                        <button class="qty-minus" data-index="${index}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-plus" data-index="${index}">+</button>
                    </div>
                    <div class="item-total">Rp ${(item.price * item.quantity).toLocaleString()}</div>
                    <button class="remove-item" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('')}
        `;

        // Render summary
        const subtotal = this.calculateSubtotal();
        const shipping = this.calculateShipping();
        const total = this.calculateTotal();
        const isFreeShipping = shipping === 0;

        summaryContainer.innerHTML = `
            <div class="summary-card">
                <h3>Ringkasan Belanja</h3>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>Rp ${subtotal.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Ongkos Kirim</span>
                    <span>${isFreeShipping ? 'GRATIS' : `Rp ${shipping.toLocaleString()}`}</span>
                </div>
                ${!isFreeShipping ? `
                    <div class="shipping-info">
                        <i class="fas fa-info-circle"></i>
                        <span>Belanja minimal Rp 200.000 untuk gratis ongkir</span>
                        <div class="shipping-progress">
                            <div class="progress-bar" style="width: ${Math.min((subtotal / 200000) * 100, 100)}%"></div>
                        </div>
                        <small>Kurang Rp ${(200000 - subtotal).toLocaleString()} lagi untuk gratis ongkir!</small>
                    </div>
                ` : `
                    <div class="free-shipping-badge">
                        <i class="fas fa-truck"></i>
                        <span>Gratis Ongkir ✨</span>
                    </div>
                `}
                <div class="summary-row total">
                    <span>Total</span>
                    <span>Rp ${total.toLocaleString()}</span>
                </div>
                <button class="btn-checkout" onclick="window.location.href='checkout.html'">
                    Checkout <i class="fas fa-arrow-right"></i>
                </button>
                <button class="btn-continue" onclick="window.location.href='products.html'">
                    Lanjutkan Belanja
                </button>
                <button class="btn-clear" onclick="cart.clearCart()">
                    <i class="fas fa-trash-alt"></i> Kosongkan Keranjang
                </button>
            </div>
        `;

        // Attach event listeners
        this.attachCartEvents();
    }

    // Attach cart events
    attachCartEvents() {
        // Quantity minus buttons
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.removeEventListener('click', this.handleMinusClick);
            btn.addEventListener('click', this.handleMinusClick.bind(this));
        });

        // Quantity plus buttons
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.removeEventListener('click', this.handlePlusClick);
            btn.addEventListener('click', this.handlePlusClick.bind(this));
        });

        // Remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.removeEventListener('click', this.handleRemoveClick);
            btn.addEventListener('click', this.handleRemoveClick.bind(this));
        });
    }

    handleMinusClick(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        const cart = this.getCart();
        if (cart[index] && cart[index].quantity > 1) {
            this.updateQuantity(index, cart[index].quantity - 1);
        }
    }

    handlePlusClick(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        const cart = this.getCart();
        if (cart[index]) {
            this.updateQuantity(index, cart[index].quantity + 1);
        }
    }

    handleRemoveClick(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        this.removeItem(index);
    }

    // Apply discount code
    applyDiscount(code) {
        const discounts = JSON.parse(localStorage.getItem('discounts')) || [];
        const discount = discounts.find(d => d.code === code && d.active && d.endDate >= new Date().toISOString().split('T')[0]);
        
        if (discount) {
            const subtotal = this.calculateSubtotal();
            if (subtotal >= discount.minPurchase) {
                const discountAmount = (subtotal * discount.discount) / 100;
                localStorage.setItem('activeDiscount', JSON.stringify({
                    code: discount.code,
                    amount: discountAmount,
                    percentage: discount.discount
                }));
                this.showNotification(`Diskon ${discount.discount}% berhasil diterapkan!`, 'success');
                this.renderCart();
                return true;
            } else {
                this.showNotification(`Minimal belanja Rp ${discount.minPurchase.toLocaleString()} untuk diskon ini`, 'error');
                return false;
            }
        } else {
            this.showNotification('Kode promo tidak valid atau sudah kadaluarsa', 'error');
            return false;
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
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

    // Dispatch cart update event
    dispatchCartEvent() {
        const event = new CustomEvent('cartUpdated', {
            detail: { cart: this.getCart(), total: this.calculateTotal() }
        });
        window.dispatchEvent(event);
    }
}

// ========================================
// INITIALIZE CART
// ========================================

const cart = new ShoppingCart();

// Export for use in other files
window.cart = cart;

// Handle add to cart buttons from other pages
document.addEventListener('DOMContentLoaded', () => {
    // Add to cart buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            const productPrice = parseInt(btn.dataset.productPrice);
            const size = btn.dataset.size || null;
            const color = btn.dataset.color || null;
            
            cart.addToCart(productId, productName, productPrice, 1, size, color);
        });
    });
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
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
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .notification.show {
        transform: translateX(0);
    }
    .notification.success {
        background: #d1fae5;
        color: #059669;
    }
    .notification.error {
        background: #fee2e2;
        color: #dc2626;
    }
    .notification.info {
        background: #dbeafe;
        color: #2563eb;
    }
    .shipping-progress {
        background: #e5e7eb;
        border-radius: 10px;
        height: 6px;
        margin: 10px 0;
        overflow: hidden;
    }
    .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #4F46E5, #7C3AED);
        border-radius: 10px;
        transition: width 0.3s;
    }
    .free-shipping-badge {
        background: #d1fae5;
        padding: 8px 12px;
        border-radius: 8px;
        margin: 10px 0;
        text-align: center;
        color: #059669;
    }
    .btn-clear {
        width: 100%;
        margin-top: 10px;
        padding: 10px;
        background: #fee2e2;
        color: #dc2626;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
    }
    .btn-clear:hover {
        background: #fecaca;
    }
`;
document.head.appendChild(notificationStyles);