
class AdminUsers {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadUsers();
        this.bindEvents();
    }

    // Check admin authentication
    checkAdminAuth() {
        const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
        if (isAdminLoggedIn !== 'true' && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Load users from localStorage
    loadUsers() {
        let users = localStorage.getItem('users');
        if (!users) {
            // Default users
            users = [
                { id: 1, name: 'Budi Santoso', email: 'budi@email.com', phone: '081234567890', role: 'customer', status: 'active', joined: '2024-01-15', avatar: null },
                { id: 2, name: 'Siti Rahayu', email: 'siti@email.com', phone: '081234567891', role: 'customer', status: 'active', joined: '2024-01-20', avatar: null },
                { id: 3, name: 'Admin Toko', email: 'admin@tokobaju.com', phone: '081234567892', role: 'admin', status: 'active', joined: '2024-01-01', avatar: null },
                { id: 4, name: 'Ahmad Fauzi', email: 'ahmad@email.com', phone: '081234567893', role: 'customer', status: 'active', joined: '2024-02-01', avatar: null },
                { id: 5, name: 'Dewi Lestari', email: 'dewi@email.com', phone: '081234567894', role: 'customer', status: 'inactive', joined: '2024-02-05', avatar: null }
            ];
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        this.users = JSON.parse(localStorage.getItem('users'));
        this.renderUsers();
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Render users table
    renderUsers() {
        const tbody = document.getElementById('usersBody');
        if (!tbody) return;
        
        const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';
        
        let filtered = this.users.filter(user => {
            const matchSearch = user.name.toLowerCase().includes(searchTerm) || 
                              user.email.toLowerCase().includes(searchTerm) ||
                              user.phone.includes(searchTerm);
            const matchRole = roleFilter === 'all' || user.role === roleFilter;
            return matchSearch && matchRole;
        });
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada pengguna ditemukan</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : `<i class="fas fa-user-circle"></i>`}
                        </div>
                        <div>
                            <strong>${user.name}</strong>
                            <small>ID: ${user.id}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td><span class="role-badge ${user.role}">${user.role === 'admin' ? 'Admin' : 'Customer'}</span></td>
                <td><span class="status-badge ${user.status}">${user.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                <td>${user.joined}</td>
                <td class="actions">
                    <button class="btn-view" onclick="adminUsers.viewUser(${user.id})" title="Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-edit" onclick="adminUsers.editUser(${user.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.role !== 'admin' ? `
                        <button class="btn-toggle" onclick="adminUsers.toggleStatus(${user.id})" title="${user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}">
                            <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                        </button>
                        <button class="btn-delete" onclick="adminUsers.deleteUser(${user.id})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span class="admin-protected">Protected</span>'}
                </td>
            </tr>
        `).join('');
    }

    // Add new user
    addUser(userData) {
        // Check if email already exists
        if (this.users.some(u => u.email === userData.email)) {
            this.showNotification('Email sudah terdaftar!', 'error');
            return null;
        }
        
        const newId = this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 6;
        
        const newUser = {
            id: newId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role || 'customer',
            status: 'active',
            joined: new Date().toISOString().split('T')[0],
            avatar: userData.avatar || null
        };
        
        this.users.push(newUser);
        this.saveUsers();
        this.renderUsers();
        this.showNotification(`Pengguna ${newUser.name} berhasil ditambahkan`, 'success');
        
        return newUser;
    }

    // Edit user
    editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            this.showUserModal(user);
        }
    }

    // View user details
    viewUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            this.showUserDetailModal(user);
        }
    }

    // Update user
    updateUser(id, userData) {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            // Check email uniqueness
            if (userData.email !== this.users[index].email && 
                this.users.some(u => u.email === userData.email)) {
                this.showNotification('Email sudah digunakan oleh pengguna lain!', 'error');
                return false;
            }
            
            this.users[index] = {
                ...this.users[index],
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role
            };
            this.saveUsers();
            this.renderUsers();
            this.showNotification(`Pengguna ${this.users[index].name} berhasil diupdate`, 'success');
            return true;
        }
        return false;
    }

    // Toggle user status
    toggleStatus(id) {
        const user = this.users.find(u => u.id === id);
        if (user && user.role !== 'admin') {
            user.status = user.status === 'active' ? 'inactive' : 'active';
            this.saveUsers();
            this.renderUsers();
            this.showNotification(`Status ${user.name} ${user.status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        } else if (user && user.role === 'admin') {
            this.showNotification('Tidak dapat mengubah status admin utama!', 'error');
        }
    }

    // Delete user
    deleteUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user && user.role !== 'admin') {
            if (confirm(`Yakin ingin menghapus pengguna ${user.name}?`)) {
                this.users = this.users.filter(u => u.id !== id);
                this.saveUsers();
                this.renderUsers();
                this.showNotification(`Pengguna ${user.name} berhasil dihapus`, 'success');
            }
        } else if (user && user.role === 'admin') {
            this.showNotification('Tidak dapat menghapus admin utama!', 'error');
        }
    }

    // Show user modal for edit
    showUserModal(user) {
        const modal = document.createElement('div');
        modal.className = 'user-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Pengguna</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <div class="form-group">
                            <label>Nama Lengkap</label>
                            <input type="text" id="userName" value="${user.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="userEmail" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label>No. Telepon</label>
                            <input type="tel" id="userPhone" value="${user.phone}" required>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="userRole" ${user.role === 'admin' ? 'disabled' : ''}>
                                <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                            ${user.role === 'admin' ? '<small class="hint">Role admin tidak dapat diubah</small>' : ''}
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Simpan Perubahan</button>
                            <button type="button" class="btn-secondary cancel-modal">Batal</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        const closeModal = () => modal.remove();
        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('.cancel-modal')?.addEventListener('click', closeModal);
        
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedData = {
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                role: document.getElementById('userRole')?.value || user.role
            };
            this.updateUser(user.id, updatedData);
            closeModal();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Show user detail modal
    showUserDetailModal(user) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const userOrders = orders.filter(o => o.customer?.email === user.email);
        
        const modal = document.createElement('div');
        modal.className = 'user-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Detail Pengguna</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-profile-detail">
                        <div class="user-avatar-large">
                            ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : `<i class="fas fa-user-circle"></i>`}
                        </div>
                        <div class="user-info-detail">
                            <h2>${user.name}</h2>
                            <p><i class="fas fa-envelope"></i> ${user.email}</p>
                            <p><i class="fas fa-phone"></i> ${user.phone}</p>
                            <p><i class="fas fa-calendar"></i> Bergabung: ${user.joined}</p>
                            <p><i class="fas fa-tag"></i> Role: <span class="role-badge ${user.role}">${user.role === 'admin' ? 'Admin' : 'Customer'}</span></p>
                            <p><i class="fas fa-circle"></i> Status: <span class="status-badge ${user.status}">${user.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></p>
                        </div>
                    </div>
                    
                    <div class="user-orders">
                        <h4>Riwayat Pesanan (${userOrders.length})</h4>
                        ${userOrders.length > 0 ? `
                            <table class="table-mini">
                                <thead>
                                    <tr><th>Order ID</th><th>Tanggal</th><th>Total</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    ${userOrders.slice(0, 5).map(order => `
                                        <tr>
                                            <td>${order.orderId}</td>
                                            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                                            <td>Rp ${(order.total || 0).toLocaleString()}</td>
                                            <td><span class="status-badge ${order.orderStatus}">${order.orderStatus}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ${userOrders.length > 5 ? '<p class="more-orders">*dan seterusnya</p>' : ''}
                        ` : '<p class="no-orders">Belum ada pesanan</p>'}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-edit" onclick="adminUsers.editUser(${user.id})">Edit Pengguna</button>
                        ${user.role !== 'admin' ? `
                            <button class="btn-${user.status === 'active' ? 'warning' : 'success'}" onclick="adminUsers.toggleStatus(${user.id})">
                                ${user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button class="btn-danger" onclick="adminUsers.deleteUser(${user.id})">Hapus Pengguna</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Show add user modal
    showAddUserModal() {
        const modal = document.createElement('div');
        modal.className = 'user-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tambah Pengguna Baru</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addUserForm">
                        <div class="form-group">
                            <label>Nama Lengkap <span class="required">*</span></label>
                            <input type="text" id="userName" required>
                        </div>
                        <div class="form-group">
                            <label>Email <span class="required">*</span></label>
                            <input type="email" id="userEmail" required>
                        </div>
                        <div class="form-group">
                            <label>No. Telepon <span class="required">*</span></label>
                            <input type="tel" id="userPhone" required>
                        </div>
                        <div class="form-group">
                            <label>Password <span class="required">*</span></label>
                            <input type="password" id="userPassword" required>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="userRole">
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Tambah Pengguna</button>
                            <button type="button" class="btn-secondary cancel-modal">Batal</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        const closeModal = () => modal.remove();
        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('.cancel-modal')?.addEventListener('click', closeModal);
        
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('userPassword').value;
            
            if (password.length < 6) {
                this.showNotification('Password minimal 6 karakter!', 'error');
                return;
            }
            
            this.addUser({
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                role: document.getElementById('userRole').value
            });
            closeModal();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Export users to CSV
    exportUsers() {
        const headers = ['ID', 'Nama', 'Email', 'Telepon', 'Role', 'Status', 'Bergabung'];
        const csv = [
            headers.join(','),
            ...this.users.map(u => [
                u.id,
                `"${u.name}"`,
                u.email,
                u.phone,
                u.role,
                u.status,
                u.joined
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pengguna_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Data pengguna berhasil diekspor', 'success');
    }

    // Bind events
    bindEvents() {
        const searchInput = document.getElementById('searchUser');
        const roleFilter = document.getElementById('userRoleFilter');
        
        if (searchInput) searchInput.addEventListener('input', () => this.renderUsers());
        if (roleFilter) roleFilter.addEventListener('change', () => this.renderUsers());
        
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) addUserBtn.addEventListener('click', () => this.showAddUserModal());
        
        const exportBtn = document.getElementById('exportUsersBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportUsers());
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
// INITIALIZE USERS MANAGEMENT
// ========================================

let adminUsers;

document.addEventListener('DOMContentLoaded', () => {
    adminUsers = new AdminUsers();
    window.adminUsers = adminUsers;
});

// Add CSS for users management
const usersStyles = document.createElement('style');
usersStyles.textContent = `
    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .user-avatar i, .user-avatar-large i {
        font-size: 40px;
        color: #9ca3af;
    }
    .user-avatar img, .user-avatar-large img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }
    .role-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
    }
    .role-badge.admin {
        background: #dbeafe;
        color: #2563eb;
    }
    .role-badge.customer {
        background: #f3e8ff;
        color: #9333ea;
    }
    .admin-protected {
        font-size: 11px;
        color: #9ca3af;
    }
    .user-modal .modal-large {
        max-width: 700px;
    }
    .user-profile-detail {
        display: flex;
        gap: 30px;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
    }
    .user-avatar-large {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .user-avatar-large i {
        font-size: 80px;
    }
    .user-info-detail h2 {
        margin-bottom: 15px;
    }
    .user-info-detail p {
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .user-orders h4 {
        margin-bottom: 15px;
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
    .no-orders, .more-orders {
        color: #6b7280;
        font-size: 13px;
        text-align: center;
        padding: 20px;
    }
    .modal-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        justify-content: flex-end;
    }
    .btn-warning, .btn-success, .btn-danger {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }
    .btn-warning {
        background: #fef3c7;
        color: #d97706;
    }
    .btn-success {
        background: #d1fae5;
        color: #059669;
    }
    .btn-danger {
        background: #fee2e2;
        color: #dc2626;
    }
    .required {
        color: #ef4444;
    }
    .hint {
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
        display: block;
    }
`;
document.head.appendChild(usersStyles);