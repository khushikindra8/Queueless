// ============================================
// QueueLess — API Helper Module
// Wraps fetch() with error handling and auth redirects
// ============================================

const API_BASE = '/api';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        // Handle auth errors — redirect to login
        if (response.status === 401) {
            // Only redirect if not already on login/register page
            if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
                window.location.href = '/login';
                return;
            }
        }

        if (!response.ok) {
            throw { status: response.status, ...data };
        }

        return data;
    } catch (error) {
        if (error.status) {
            throw error;
        }
        console.error('API Error:', error);
        throw { success: false, message: 'Network error. Please check your connection.' };
    }
}

/**
 * GET request
 */
async function apiGet(endpoint) {
    return apiRequest(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
async function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * PUT request
 */
async function apiPut(endpoint, body) {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

/**
 * DELETE request
 */
async function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
}

/**
 * Check if user is authenticated and get user info
 * @returns {Promise<object|null>} User object or null
 */
async function getCurrentUser() {
    try {
        const data = await apiGet('/auth/me');
        return data.user;
    } catch {
        return null;
    }
}

/**
 * Redirect based on user role
 */
function redirectByRole(role) {
    switch (role) {
        case 'admin':
            window.location.href = '/admin/dashboard';
            break;
        case 'staff':
            window.location.href = '/staff/dashboard';
            break;
        default:
            window.location.href = '/user/dashboard';
    }
}

/**
 * Ensure user is authenticated — redirect to login if not
 */
async function requireAuth(allowedRoles = null) {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        redirectByRole(user.role);
        return null;
    }
    return user;
}
