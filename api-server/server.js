// Load environment variables first
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
console.log('Setting up middleware...');

// Security middleware
app.use(helmet()); // Adds security headers
console.log('✓ Helmet security headers enabled');

// CORS middleware (allows your mobile app to connect)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:19006', 'http://localhost:19000'], // Expo default ports
  credentials: true
}));
console.log('✓ CORS enabled');

// Parse JSON bodies (so we can receive JSON from mobile app)
app.use(express.json({ limit: '10mb' }));
console.log('✓ JSON parser enabled');

// Rate limiting (prevent spam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);
console.log('✓ Rate limiting enabled');

// Basic Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'iMobilize API Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test route to make sure everything works
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working correctly!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('\n🚀 iMobilize API Server started successfully!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});