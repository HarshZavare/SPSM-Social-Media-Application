const express = require('express');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { securityMiddleware } = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const privacyRoutes = require('./routes/privacy');
const messageRoutes = require('./routes/messages');
const fileRoutes = require('./routes/files');
const recoveryRoutes = require('./routes/recovery');
const monitoringRoutes = require('./routes/monitoring');
const friendsRoutes = require('./routes/friends');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Apply security middleware (Helmet, CORS, XSS, HPP)
securityMiddleware(app);

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// General rate limiting
app.use('/api/', generalLimiter);

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve uploaded post images (with cross-origin headers for frontend)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SPSM API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'An internal server error occurred';

  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// Start Server
// ============================================
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        🔒 SPSM - Secure Social Media Platform   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Server:     http://localhost:${PORT}              ║`);
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(34)}║`);
  console.log('║  API Base:   /api                                ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log('📡 API Endpoints:');
  console.log('   Auth:       /api/auth/*');
  console.log('   Privacy:    /api/privacy/*');
  console.log('   Messages:   /api/messages/*');
  console.log('   Files:      /api/files/*');
  console.log('   Recovery:   /api/recovery/*');
  console.log('   Monitoring: /api/monitoring/*');
  console.log('   Posts:      /api/posts/*');
  console.log('   Health:     /api/health');
  console.log('');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    console.log('Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
