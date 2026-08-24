const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const queueRoutes = require('./routes/queue');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'queueless_default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);

// ============================================
// Page Routes (serve HTML pages)
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/user/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user', 'dashboard.html'));
});

app.get('/staff/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'staff', 'dashboard.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================
async function startServer() {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`\n🚀 QueueLess Server running on http://localhost:${PORT}`);
        console.log(`📋 API Base: http://localhost:${PORT}/api`);
        console.log(`🌐 Frontend: http://localhost:${PORT}\n`);
    });
}

startServer();
