// ============================================
// Authentication & Authorization Middleware
// ============================================

/**
 * Check if user is authenticated (has active session)
 */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Please login to continue' });
}

/**
 * Check if user has admin role
 */
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
}

/**
 * Check if user has staff or admin role
 */
function isStaff(req, res, next) {
    if (req.session && req.session.user && 
        (req.session.user.role === 'staff' || req.session.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Staff privileges required.' });
}

/**
 * Check if user has user role
 */
function isUser(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'user') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied.' });
}

module.exports = { isAuthenticated, isAdmin, isStaff, isUser };
