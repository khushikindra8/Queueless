// ============================================
// QueueLess — Admin Dashboard Logic
// ============================================

let currentUser = null;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await requireAuth(['admin']);
    if (!currentUser) return;

    document.getElementById('navbar').innerHTML = renderNavbar(currentUser, 'dashboard');

    await loadDashboardData();
    await loadServices();
    await loadUsers();

    // Poll stats
    pollingInterval = setInterval(loadDashboardData, 10000);

    // Service form handler
    document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
});

// ============================================
// Tabs
// ============================================
function showTab(tab) {
    document.getElementById('servicesTab').classList.add('hidden');
    document.getElementById('usersTab').classList.add('hidden');
    document.getElementById('queuesTab').classList.add('hidden');

    document.getElementById('tabServices').className = 'btn btn-secondary';
    document.getElementById('tabUsers').className = 'btn btn-secondary';
    document.getElementById('tabQueues').className = 'btn btn-secondary';

    document.getElementById(`${tab}Tab`).classList.remove('hidden');
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).className = 'btn btn-primary';

    if (tab === 'queues') loadQueueBreakdown();
}

// ============================================
// Dashboard Stats
// ============================================
async function loadDashboardData() {
    try {
        const data = await apiGet('/admin/dashboard');
        const stats = data.stats;

        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card purple animate-fade-in">
                <div class="stat-icon">📋</div>
                <div class="stat-value">${stats.total_today}</div>
                <div class="stat-label">Total Tokens Today</div>
            </div>
            <div class="stat-card orange animate-fade-in animate-delay-1">
                <div class="stat-icon">⏳</div>
                <div class="stat-value">${stats.waiting}</div>
                <div class="stat-label">Currently Waiting</div>
            </div>
            <div class="stat-card green animate-fade-in animate-delay-2">
                <div class="stat-icon">✓</div>
                <div class="stat-value">${stats.served}</div>
                <div class="stat-label">Served Today</div>
            </div>
            <div class="stat-card red animate-fade-in animate-delay-3">
                <div class="stat-icon">⏭</div>
                <div class="stat-value">${stats.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat-card cyan animate-fade-in animate-delay-1">
                <div class="stat-icon">🔄</div>
                <div class="stat-value">${stats.active}</div>
                <div class="stat-label">Being Served Now</div>
            </div>
            <div class="stat-card purple animate-fade-in animate-delay-2">
                <div class="stat-icon">⏱</div>
                <div class="stat-value">${stats.avg_wait_minutes} min</div>
                <div class="stat-label">Avg Wait Time</div>
            </div>
        `;
    } catch (error) {
        console.error('Dashboard stats error:', error);
    }
}

// ============================================
// Service Management
// ============================================
async function loadServices() {
    try {
        const data = await apiGet('/services/all');
        const tbody = document.getElementById('servicesTableBody');

        if (data.services.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:2rem;">No services found</td></tr>`;
            return;
        }

        tbody.innerHTML = data.services.map(s => `
            <tr>
                <td><strong>${escapeHtml(s.prefix)}</strong></td>
                <td>${escapeHtml(s.name)}</td>
                <td class="text-secondary">${escapeHtml(s.description || '—')}</td>
                <td>${s.is_active ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-secondary" onclick="editService(${s.id}, '${escapeHtml(s.name)}', '${escapeHtml(s.prefix)}', '${escapeHtml(s.description || '')}')">Edit</button>
                        ${s.is_active 
                            ? `<button class="btn btn-sm btn-danger" onclick="toggleService(${s.id}, false)">Deactivate</button>`
                            : `<button class="btn btn-sm btn-success" onclick="toggleService(${s.id}, true)">Activate</button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Failed to load services', 'error');
    }
}

function showAddServiceModal() {
    document.getElementById('serviceModalTitle').textContent = 'Add New Service';
    document.getElementById('serviceSubmitBtn').textContent = 'Add Service';
    document.getElementById('serviceEditId').value = '';
    document.getElementById('serviceName').value = '';
    document.getElementById('servicePrefix').value = '';
    document.getElementById('serviceDescription').value = '';
    document.getElementById('serviceModal').classList.add('active');
}

function editService(id, name, prefix, description) {
    document.getElementById('serviceModalTitle').textContent = 'Edit Service';
    document.getElementById('serviceSubmitBtn').textContent = 'Save Changes';
    document.getElementById('serviceEditId').value = id;
    document.getElementById('serviceName').value = name;
    document.getElementById('servicePrefix').value = prefix;
    document.getElementById('serviceDescription').value = description;
    document.getElementById('serviceModal').classList.add('active');
}

function closeServiceModal() {
    document.getElementById('serviceModal').classList.remove('active');
}

async function handleServiceSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('serviceEditId').value;
    const name = document.getElementById('serviceName').value.trim();
    const prefix = document.getElementById('servicePrefix').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();

    if (!name || !prefix) {
        showToast('Name and prefix are required', 'warning');
        return;
    }

    try {
        if (id) {
            await apiPut(`/services/${id}`, { name, prefix, description });
            showToast('Service updated successfully', 'success');
        } else {
            await apiPost('/services', { name, prefix, description });
            showToast('Service created successfully', 'success');
        }
        closeServiceModal();
        await loadServices();
    } catch (error) {
        showToast(error.message || 'Failed to save service', 'error');
    }
}

async function toggleService(id, activate) {
    try {
        if (activate) {
            await apiPut(`/services/${id}`, { is_active: true });
            showToast('Service activated', 'success');
        } else {
            await apiDelete(`/services/${id}`);
            showToast('Service deactivated', 'warning');
        }
        await loadServices();
    } catch (error) {
        showToast(error.message || 'Failed to update service', 'error');
    }
}

// ============================================
// User Management
// ============================================
async function loadUsers() {
    try {
        const data = await apiGet('/admin/users');
        const tbody = document.getElementById('usersTableBody');

        tbody.innerHTML = data.users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${escapeHtml(u.name)}</td>
                <td class="text-secondary">${escapeHtml(u.email)}</td>
                <td>${getRoleBadge(u.role)}</td>
                <td>${formatDate(u.created_at)}</td>
                <td>
                    ${u.id !== currentUser.id ? `
                    <select class="form-select" style="width: auto; min-width: 120px; padding: 6px 12px; font-size: 0.85rem;" 
                            onchange="changeUserRole(${u.id}, this.value)">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>Staff</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    ` : '<span class="text-muted">You</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Failed to load users', 'error');
    }
}

async function changeUserRole(userId, newRole) {
    try {
        await apiPut(`/admin/users/${userId}/role`, { role: newRole });
        showToast(`Role updated to ${newRole}`, 'success');
        await loadUsers();
    } catch (error) {
        showToast(error.message || 'Failed to change role', 'error');
        await loadUsers(); // Revert select
    }
}

// ============================================
// Queue Breakdown
// ============================================
async function loadQueueBreakdown() {
    try {
        const data = await apiGet('/admin/dashboard');
        const breakdown = data.stats.service_breakdown;
        const container = document.getElementById('queueBreakdown');

        if (!breakdown || breakdown.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No Queue Data</h3>
                    <p>Queue data will appear here once tokens are generated.</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="card">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Prefix</th>
                                <th>Total Today</th>
                                <th>Waiting</th>
                                <th>Active</th>
                                <th>Served</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${breakdown.map(s => `
                                <tr>
                                    <td><strong>${escapeHtml(s.name)}</strong></td>
                                    <td><span class="badge badge-staff">${escapeHtml(s.prefix)}</span></td>
                                    <td>${s.total || 0}</td>
                                    <td>${s.waiting || 0}</td>
                                    <td>${s.active || 0}</td>
                                    <td>${s.served || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        showToast('Failed to load queue data', 'error');
    }
}
