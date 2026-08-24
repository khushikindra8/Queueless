// ============================================
// QueueLess — Shared Utilities
// Toast notifications, formatting, DOM helpers
// ============================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Format date/time
 */
function formatTime(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '—';
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

/**
 * Time ago (e.g., "5 mins ago")
 */
function timeAgo(dateString) {
    if (!dateString) return '—';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;

    return formatDate(dateString);
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const labels = {
        waiting: 'Waiting',
        called: 'Called',
        serving: 'Serving',
        served: 'Served',
        skipped: 'Skipped'
    };
    return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

/**
 * Get role badge HTML
 */
function getRoleBadge(role) {
    const labels = {
        user: 'User',
        staff: 'Staff',
        admin: 'Admin'
    };
    return `<span class="badge badge-${role}">${labels[role] || role}</span>`;
}

/**
 * Set up polling interval
 * @returns {number} Interval ID for cleanup
 */
function startPolling(callback, intervalMs = 5000) {
    callback(); // Run immediately
    return setInterval(callback, intervalMs);
}

/**
 * Render navbar with user info
 */
function renderNavbar(user, activePage = '') {
    const navLinks = {
        user: `<a href="/user/dashboard" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>`,
        staff: `<a href="/staff/dashboard" class="${activePage === 'dashboard' ? 'active' : ''}">Queue Manager</a>`,
        admin: `
            <a href="/admin/dashboard" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
        `
    };

    return `
    <nav class="navbar">
        <div class="container">
            <a href="/" class="navbar-brand">
                <div class="logo-icon">Q</div>
                QueueLess
            </a>
            <div class="navbar-nav">
                ${navLinks[user.role] || ''}
            </div>
            <div class="navbar-user">
                <span class="user-name">${user.name}</span>
                <span class="user-role">${user.role}</span>
                <button class="btn btn-sm btn-secondary" onclick="handleLogout()">Logout</button>
            </div>
        </div>
    </nav>`;
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        await apiPost('/auth/logout');
        window.location.href = '/login';
    } catch {
        window.location.href = '/login';
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
