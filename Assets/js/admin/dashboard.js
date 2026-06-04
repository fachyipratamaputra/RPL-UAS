/**
 * dashboard.js - Admin Dashboard
 * Terhubung dengan: pages/admin/dashboard.html
 * Dependensi: Chart.js, localStorage
 */

// ========================================
// ADMIN DASHBOARD MANAGEMENT SYSTEM
// ========================================

class AdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadDashboardData();
        this.initCharts();
        this.loadRecentOrders();
        this.startRealtimeUpdates();
    }

    // Check admin authentication
    checkAdminAuth() {
        const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
        if (isAdminLoggedIn !== 'true') {
            window.location.href = 'login.html';
        }
    }

    // Load dashboard data
    loadDashboardData() {
        // Get data from localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Calculate stats
        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalUsers = users.length + 5; // +5 default users
        
        // Calculate revenue
        let totalRevenue = 0;
        let pendingRevenue = 0;
        let completedOrders = 0;
        
        orders.forEach(order => {
            if (order.paymentStatus === 'paid' || order.orderStatus === 'delivered') {
                totalRevenue += order.total || 0;
                completedOrders++;
            }
            if (order.paymentStatus === 'pending') {
                pendingRevenue += order.total || 0;
            }
        });
        
        // Update stats display
        this.updateStatCards(totalOrders, totalProducts, totalUsers, totalRevenue);
        
        // Store data for charts
        this.ordersData = orders;
        this.revenueData = { totalRevenue, pendingRevenue, completedOrders };
        
        // Update admin name
        const adminName = localStorage.getItem('adminUsername') || 'Admin';
        document.getElementById('adminName').textContent = adminName;
    }

    // Update stat cards
    updateStatCards(orders, products, users, revenue) {
        const stats = [
            { id: 'totalOrders', value: orders, icon: 'shopping-bag', color: '#4F46E5' },
            { id: 'totalUsers', value: users, icon: 'users', color: '#10B981' },
            { id: 'totalProducts', value: products, icon: 'box', color: '#F59E0B' },
            { id: 'totalRevenue', value: `Rp ${revenue.toLocaleString()}`, icon: 'chart-line', color: '#EF4444' }
        ];
        
        stats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element) {
                element.textContent = stat.value;
            }
        });
        
        // Also update percentage changes
        this.updatePercentageChanges();
    }

    // Update percentage changes (simulasi)
    updatePercentageChanges() {
        const changes = [
            { id: 'ordersChange', value: '+12%', trend: 'up' },
            { id: 'usersChange', value: '+8%', trend: 'up' },
            { id: 'productsChange', value: '+5%', trend: 'up' },
            { id: 'revenueChange', value: '+15%', trend: 'up' }
        ];
        
        changes.forEach(change => {
            const element = document.getElementById(change.id);
            if (element) {
                element.innerHTML = `<i class="fas fa-arrow-${change.trend}"></i> ${change.value}`;
                element.className = `trend ${change.trend}`;
            }
        });
    }

    // Initialize charts
    initCharts() {
        this.initSalesChart();
        this.initCategoryChart();
        this.initRevenueChart();
    }

    // Sales chart (line chart)
    initSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;
        
        // Get last 7 days sales data
        const salesData = this.getLast7DaysSales();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Penjualan',
                    data: salesData.values,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#4F46E5',
                    pointBorderColor: '#fff',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Penjualan: ${context.raw} unit`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e5e7eb'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Category chart (doughnut chart)
    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        const categories = {
            'pria': 0,
            'wanita': 0,
            'anak': 0,
            'aksesoris': 0
        };
        
        products.forEach(product => {
            if (categories[product.category] !== undefined) {
                categories[product.category]++;
            }
        });
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pakaian Pria', 'Pakaian Wanita', 'Pakaian Anak', 'Aksesoris'],
                datasets: [{
                    data: [categories.pria, categories.wanita, categories.anak, categories.aksesoris],
                    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Revenue chart (bar chart)
    initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        const monthlyRevenue = this.getMonthlyRevenue();
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [{
                    label: 'Pendapatan (Rp)',
                    data: monthlyRevenue,
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Rp ${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Get last 7 days sales data
    getLast7DaysSales() {
        const orders = this.ordersData || [];
        const labels = [];
        const values = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
            labels.push(dayName);
            
            const dailyOrders = orders.filter(order => 
                order.orderDate && order.orderDate.split('T')[0] === dateStr
            );
            values.push(dailyOrders.length);
        }
        
        return { labels, values };
    }

    // Get monthly revenue
    getMonthlyRevenue() {
        const orders = this.ordersData || [];
        const monthlyRevenue = new Array(12).fill(0);
        
        orders.forEach(order => {
            if (order.paymentStatus === 'paid' && order.orderDate) {
                const month = new Date(order.orderDate).getMonth();
                monthlyRevenue[month] += order.total || 0;
            }
        });
        
        return monthlyRevenue;
    }

    // Load recent orders
    loadRecentOrders() {
        const orders = this.ordersData || [];
        const recentOrders = orders.slice(-5).reverse();
        const tbody = document.getElementById('recentOrdersBody');
        
        if (!tbody) return;
        
        if (recentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada pesanan</td></tr>';
            return;
        }
        
        tbody.innerHTML = recentOrders.map(order => `
            <tr>
                <td><strong>${order.orderId}</strong></td>
                <td>${order.customer?.name || 'Customer'}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>Rp ${(order.total || 0).toLocaleString()}</td>
                <td><span class="status-badge ${order.orderStatus}">${this.getStatusText(order.orderStatus)}</span></td>
                <td>
                    <button class="btn-sm" onclick="adminDashboard.viewOrderDetails('${order.orderId}')">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Get status text
    getStatusText(status) {
        const statusMap = {
            'pending': 'Menunggu',
            'processing': 'Diproses',
            'shipped': 'Dikirim',
            'delivered': 'Selesai',
            'cancelled': 'Dibatalkan'
        };
        return statusMap[status] || status;
    }

    // View order details
    viewOrderDetails(orderId) {
        const orders = this.ordersData || [];
        const order = orders.find(o => o.orderId === orderId);
        
        if (order) {
            this.showOrderModal(order);
        }
    }

    // Show order modal
    showOrderModal(order) {
        const modal = document.createElement('div');
        modal.className = 'order-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detail Pesanan</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-info">
                        <p><strong>Nomor Pesanan:</strong> ${order.orderId}</p>
                        <p><strong>Tanggal:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${order.orderStatus}">${this.getStatusText(order.orderStatus)}</span></p>
                    </div>
                    
                    <div class="customer-info">
                        <h4>Informasi Pelanggan</h4>
                        <p><strong>Nama:</strong> ${order.customer?.name || '-'}</p>
                        <p><strong>Email:</strong> ${order.customer?.email || '-'}</p>
                        <p><strong>Telepon:</strong> ${order.customer?.phone || '-'}</p>
                    </div>
                    
                    <div class="shipping-info">
                        <h4>Alamat Pengiriman</h4>
                        <p>${order.shipping?.address || '-'}</p>
                        <p>${order.shipping?.city || ''} ${order.shipping?.province || ''} - ${order.shipping?.postalCode || ''}</p>
                    </div>
                    
                    <div class="order-items">
                        <h4>Item Pesanan</h4>
                        <table class="table-mini">
                            <thead>
                                <tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>Rp ${item.price.toLocaleString()}</td>
                                        <td>Rp ${(item.price * item.quantity).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="order-total">
                        <p><strong>Subtotal:</strong> Rp ${order.subtotal?.toLocaleString() || 0}</p>
                        <p><strong>Ongkos Kirim:</strong> ${order.shippingCost === 0 ? 'GRATIS' : `Rp ${order.shippingCost?.toLocaleString() || 0}`}</p>
                        ${order.discount ? `<p><strong>Diskon:</strong> - Rp ${order.discount.amount?.toLocaleString() || 0}</p>` : ''}
                        <p class="total"><strong>Total:</strong> Rp ${order.total?.toLocaleString() || 0}</p>
                    </div>
                    
                    <div class="status-update">
                        <label>Update Status:</label>
                        <select id="updateStatus" class="status-select">
                            <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Menunggu Pembayaran</option>
                            <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Diproses</option>
                            <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Dikirim</option>
                            <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Selesai</option>
                            <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
                        </select>
                        <button class="btn-primary btn-sm" onclick="adminDashboard.updateOrderStatus('${order.orderId}')">Update Status</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Update order status
    updateOrderStatus(orderId) {
        const select = document.querySelector('#updateStatus');
        const newStatus = select.value;
        
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.orderId === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].orderStatus = newStatus;
            orders[orderIndex].statusHistory = orders[orderIndex].statusHistory || [];
            orders[orderIndex].statusHistory.push({
                status: newStatus,
                date: new Date().toISOString(),
                note: `Status diubah oleh admin`
            });
            
            localStorage.setItem('orders', JSON.stringify(orders));
            alert('Status pesanan berhasil diupdate!');
            
            // Reload data
            this.loadDashboardData();
            this.loadRecentOrders();
            
            // Close modal
            const modal = document.querySelector('.order-modal');
            if (modal) modal.remove();
        }
    }

    // Start realtime updates
    startRealtimeUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
            this.loadRecentOrders();
        }, 30000);
    }

    // Export report
    exportReport() {
        const orders = this.ordersData || [];
        const reportData = orders.map(order => ({
            'Order ID': order.orderId,
            'Tanggal': new Date(order.orderDate).toLocaleDateString(),
            'Pelanggan': order.customer?.name,
            'Total': order.total,
            'Status': order.orderStatus
        }));
        
        // Convert to CSV
        const headers = Object.keys(reportData[0] || {});
        const csv = [
            headers.join(','),
            ...reportData.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Laporan berhasil diekspor!');
    }
}

// ========================================
// INITIALIZE DASHBOARD
// ========================================

let adminDashboard;

document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
    window.adminDashboard = adminDashboard;
});

// Add CSS for modal and status badges
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
    .order-modal {
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
    .order-modal .modal-content {
        background: white;
        border-radius: 16px;
        max-width: 700px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }
    .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .modal-body {
        padding: 20px;
    }
    .order-info, .customer-info, .shipping-info, .order-items {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f3f4f6;
    }
    .table-mini {
        width: 100%;
        border-collapse: collapse;
    }
    .table-mini th, .table-mini td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #f3f4f6;
    }
    .order-total {
        text-align: right;
        padding-top: 15px;
    }
    .order-total .total {
        font-size: 18px;
        color: #4F46E5;
    }
    .status-update {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .status-select {
        padding: 8px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        flex: 1;
    }
    .trend.up {
        color: #10b981;
    }
    .trend.down {
        color: #ef4444;
    }
    .btn-sm {
        padding: 5px 12px;
        background: #4F46E5;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    }
    .text-center {
        text-align: center;
    }
`;
document.head.appendChild(dashboardStyles);