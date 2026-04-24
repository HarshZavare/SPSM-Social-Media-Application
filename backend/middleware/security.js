const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
require('dotenv').config();

const securityMiddleware = (app) => {
  // Helmet - security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5000'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS - whitelist frontend
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }));

  // HTTP Parameter Pollution protection
  app.use(hpp());

  // XSS protection via input sanitization
  app.use((req, res, next) => {
    if (req.body) {
      const sanitize = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            obj[key] = obj[key]
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/javascript:/gi, '')
              .replace(/on\w+=/gi, '');
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitize(obj[key]);
          }
        }
      };
      // Don't sanitize password fields
      const passwordFields = ['password', 'newPassword', 'currentPassword'];
      const saved = {};
      passwordFields.forEach(f => {
        if (req.body[f]) {
          saved[f] = req.body[f];
        }
      });
      sanitize(req.body);
      Object.assign(req.body, saved);
    }
    next();
  });

  // Disable X-Powered-By
  app.disable('x-powered-by');
};

module.exports = { securityMiddleware };
