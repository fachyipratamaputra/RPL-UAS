/**
 * products.js - Admin Products Management
 * Terhubung dengan: pages/admin/products.html, add-product.html, edit-product.html
 * Dependensi: localStorage
 */

// ========================================
// ADMIN PRODUCTS MANAGEMENT SYSTEM
// ========================================

class AdminProducts {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadProducts();
        this.bindEvents();
    }

    // Check admin authentication
    checkAdminAuth() {
        const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
        if (isAdminLoggedIn !== 'true' && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Load products from localStorage
    loadProducts() {
        let products = localStorage.getItem('adminProducts');
        if (!products) {
            // Default products
            products = [
                { id: 1, name: 'Kaos Polos Premium', category: 'pria', price: 150000, stock: 50, image: 'https://via.placeholder.com/100', status: 'active', description: 'Kaos polos premium bahan katun', sizes: ['S','M','L','XL'], colors: ['Hitam','Putih'] },
                { id: 2, name: 'Kemeja Flanel Pria', category: 'pria', price: 250000, stock: 30, image: 'https://via.placeholder.com/100', status: 'active', description: 'Kemeja flanel casual', sizes: ['M','L','XL'], colors: ['Merah','Hitam'] },
                { id: 3, name: 'Dress Wanita Elegan', category: 'wanita', price: 350000, stock: 25, image: 'https://via.placeholder.com/100', status: 'active', description: 'Dress elegan untuk acara formal', sizes: ['S','M','L'], colors: ['Hitam','Burgundy'] },
                { id: 4, name: 'Jaket Denim', category: 'pria', price: 450000, stock: 15, image: 'https://via.placeholder.com/100', status: 'active', description: 'Jaket denim classic', sizes: ['L','XL','XXL'], colors: ['Biru','Hitam'] },
                { id: 5, name: 'Baju Anak Lucu', category: 'anak', price: 120000, stock: 40, image: 'https://via.placeholder.com/100', status: 'active', description: 'Baju anak motif lucu', sizes: ['S','M'], colors: ['Merah','Biru','Kuning'] },
                { id: 6, name: 'Topi Fashion', category: 'aksesoris', price: 75000, stock: 100, image: 'https://via.placeholder.com/100', status: 'active', description: 'Topi fashion trendy', sizes: ['All'], colors: ['Hitam','Putih','Navy'] }
            ];
            localStorage.setItem('adminProducts', JSON.stringify(products));
        }
        
        this.products = JSON.parse(localStorage.getItem('adminProducts'));
        this.renderProducts();
    }

    // Save products to localStorage
    saveProducts() {
        localStorage.setItem('adminProducts', JSON.stringify(this.products));
    }

    // Render products table
    renderProducts() {
        const tbody = document.getElementById('productsBody');
        if (!tbody) return;
        
        const searchTerm = document.getElementById('searchProduct')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const stockFilter = document.getElementById('stockFilter')?.value || 'all';
        
        let filtered = this.products.filter(product => {
            const matchSearch = product.name.toLowerCase().includes(searchTerm);
            const matchCategory = categoryFilter === 'all' || product.category === categoryFilter;
            let matchStock = true;
            if (stockFilter === 'low') matchStock = product.stock < 10 && product.stock > 0;
            if (stockFilter === 'out') matchStock = product.stock === 0;
            return matchSearch && matchCategory && matchStock;
        });
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada produk ditemukan</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><img src="${product.image}" alt="${product.name}" class="product-thumb" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td><strong>${product.name}</strong></td>
                <td>${this.getCategoryName(product.category)}</td>
                <td>Rp ${product.price.toLocaleString()}</td>
                <td class="${this.getStockClass(product.stock)}">${product.stock}</td>
                <td><span class="status-badge ${product.status}">${product.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                <td class="actions">
                    <button class="btn-edit" onclick="adminProducts.editProduct(${product.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-toggle" onclick="adminProducts.toggleStatus(${product.id})" title="${product.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}">
                        <i class="fas fa-${product.status === 'active' ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="btn-delete" onclick="adminProducts.deleteProduct(${product.id})" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Get category name
    getCategoryName(category) {
        const categories = {
            pria: 'Pakaian Pria',
            wanita: 'Pakaian Wanita',
            anak: 'Pakaian Anak',
            aksesoris: 'Aksesoris'
        };
        return categories[category] || category;
    }

    // Get stock class
    getStockClass(stock) {
        if (stock === 0) return 'stock-out';
        if (stock < 10) return 'stock-low';
        return 'stock-ok';
    }

    // Add new product
    addProduct(productData) {
        const newId = this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
        
        const newProduct = {
            id: newId,
            name: productData.name,
            category: productData.category,
            price: parseInt(productData.price),
            stock: parseInt(productData.stock),
            image: productData.image || 'https://via.placeholder.com/100',
            status: productData.status || 'active',
            description: productData.description || '',
            sizes: productData.sizes || [],
            colors: productData.colors || []
        };
        
        this.products.push(newProduct);
        this.saveProducts();
        this.renderProducts();
        
        return newProduct;
    }

    // Edit product
    editProduct(id) {
        window.location.href = `edit-product.html?id=${id}`;
    }

    // Update product
    updateProduct(id, productData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = {
                ...this.products[index],
                name: productData.name,
                category: productData.category,
                price: parseInt(productData.price),
                stock: parseInt(productData.stock),
                image: productData.image || this.products[index].image,
                status: productData.status,
                description: productData.description || this.products[index].description,
                sizes: productData.sizes || this.products[index].sizes,
                colors: productData.colors || this.products[index].colors
            };
            this.saveProducts();
            this.renderProducts();
            return true;
        }
        return false;
    }

    // Toggle product status
    toggleStatus(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.status = product.status === 'active' ? 'inactive' : 'active';
            this.saveProducts();
            this.renderProducts();
            this.showNotification(`Produk ${product.name} ${product.status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        }
    }

    // Delete product
    deleteProduct(id) {
        if (confirm('Yakin ingin menghapus produk ini?')) {
            const product = this.products.find(p => p.id === id);
            this.products = this.products.filter(p => p.id !== id);
            this.saveProducts();
            this.renderProducts();
            this.showNotification(`Produk ${product.name} berhasil dihapus`, 'info');
        }
    }

    // Bulk delete products
    bulkDelete(ids) {
        if (confirm(`Hapus ${ids.length} produk yang dipilih?`)) {
            this.products = this.products.filter(p => !ids.includes(p.id));
            this.saveProducts();
            this.renderProducts();
            this.showNotification(`${ids.length} produk berhasil dihapus`, 'success');
        }
    }

    // Update stock
    updateStock(id, newStock) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.stock = parseInt(newStock);
            this.saveProducts();
            this.renderProducts();
            this.showNotification(`Stok ${product.name} diperbarui menjadi ${product.stock}`, 'success');
        }
    }

    // Export products to CSV
    exportProducts() {
        const headers = ['ID', 'Nama Produk', 'Kategori', 'Harga', 'Stok', 'Status'];
        const csv = [
            headers.join(','),
            ...this.products.map(p => [
                p.id,
                `"${p.name}"`,
                this.getCategoryName(p.category),
                p.price,
                p.stock,
                p.status
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `produk_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Produk berhasil diekspor', 'success');
    }

    // Import products from CSV
    importProducts(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const rows = text.split('\n').slice(1);
            const newProducts = [];
            
            rows.forEach(row => {
                const cols = row.split(',');
                if (cols.length >= 5) {
                    newProducts.push({
                        id: this.products.length + newProducts.length + 1,
                        name: cols[1]?.replace(/"/g, '') || '',
                        category: 'pria',
                        price: parseInt(cols[3]) || 0,
                        stock: parseInt(cols[4]) || 0,
                        image: 'https://via.placeholder.com/100',
                        status: 'active',
                        description: '',
                        sizes: [],
                        colors: []
                    });
                }
            });
            
            this.products = [...this.products, ...newProducts];
            this.saveProducts();
            this.renderProducts();
            this.showNotification(`${newProducts.length} produk berhasil diimpor`, 'success');
        };
        reader.readAsText(file);
    }

    // Get product by ID (for edit page)
    getProductById(id) {
        return this.products.find(p => p.id === parseInt(id));
    }

    // Bind events
    bindEvents() {
        const searchInput = document.getElementById('searchProduct');
        const categoryFilter = document.getElementById('categoryFilter');
        const stockFilter = document.getElementById('stockFilter');
        
        if (searchInput) searchInput.addEventListener('input', () => this.renderProducts());
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.renderProducts());
        if (stockFilter) stockFilter.addEventListener('change', () => this.renderProducts());
        
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportProducts());
        
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = (e) => this.importProducts(e.target.files[0]);
                input.click();
            });
        }
    }

    // Show notification
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
}

// ========================================
// INITIALIZE PRODUCTS MANAGEMENT
// ========================================

let adminProducts;

document.addEventListener('DOMContentLoaded', () => {
    adminProducts = new AdminProducts();
    window.adminProducts = adminProducts;
});

// Add CSS for admin notifications and stock indicators
const productsStyles = document.createElement('style');
productsStyles.textContent = `
    .admin-notification {
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .admin-notification.show {
        transform: translateX(0);
    }
    .admin-notification.success {
        background: #d1fae5;
        color: #059669;
    }
    .admin-notification.error {
        background: #fee2e2;
        color: #dc2626;
    }
    .admin-notification.info {
        background: #dbeafe;
        color: #2563eb;
    }
    .stock-out {
        color: #dc2626;
        font-weight: bold;
    }
    .stock-low {
        color: #f59e0b;
        font-weight: bold;
    }
    .stock-ok {
        color: #10b981;
    }
    .product-thumb {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 8px;
    }
    .text-center {
        text-align: center;
    }
`;
document.head.appendChild(productsStyles);