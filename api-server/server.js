// Load environment variables first
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import database configuration
const dbConfig = require('./config/database');
const { 
  initializeDatabases, 
  closeDatabaseConnections, 
  pgPool
} = dbConfig;

// Import routes
const authRoutes = require('./routes/auth');
const legalRoutes = require('./routes/legal');
const communityRoutes = require('./routes/community');
const eventsRoutes = require('./routes/events');
const groupsRoutes = require('./routes/groups');
const { router: notificationsRoutes, createEventReminders } = require('./routes/notifications');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
console.log('⚙️  Setting up middleware...');

// Security middleware
app.use(helmet());
console.log('✅ Helmet security headers enabled');

// CORS middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:19006', 'http://localhost:19000', 'http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));
console.log('✅ CORS enabled');

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log('✅ JSON parser enabled');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
console.log('✅ Rate limiting enabled');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Basic Routes
app.get('/', (req, res) => {
  res.json({ 
    name: 'iMobilize API',
    version: '1.5.0',
    status: 'running',
    phase: 'Phase 5: Advanced Integration',
    docs: '/api/test for endpoint testing',
    health: '/health for system status'
  });
});

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    // Test PostgreSQL
    const pgClient = await pgPool.connect();
    const pgResult = await pgClient.query('SELECT current_database() as db_name');
    pgClient.release();
    
    // Test MongoDB
    const mongoDatabase = dbConfig.mongoDB;
    if (!mongoDatabase) {
      throw new Error('MongoDB not initialized');
    }
    
    await mongoDatabase.admin().ping();
    
    res.json({ 
      status: 'healthy',
      version: '1.5.0',
      databases: {
        postgresql: 'connected',
        mongodb: 'connected'
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working correctly!',
    version: '1.5.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: '/api/auth/*',
      groups: '/api/groups/*',
      events: '/api/events/*',
      community: '/api/community/*',
      notifications: '/api/notifications/*',
      legal: '/api/legal/*'
    }
  });
});

// PostgreSQL test route
app.get('/api/test/postgresql', async (req, res) => {
  try {
    const client = await pgPool.connect();
    const result = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgresql_version,
        NOW() as current_time
    `);
    client.release();
    
    res.json({
      status: '✅ PostgreSQL connection successful',
      data: result.rows[0],
      connection_info: {
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        database: process.env.PG_DATABASE,
        user: process.env.PG_USER
      }
    });
  } catch (error) {
    console.error('PostgreSQL test failed:', error);
    res.status(500).json({
      status: '❌ PostgreSQL connection failed',
      error: error.message,
      code: error.code
    });
  }
});

// MongoDB test route
app.get('/api/test/mongodb', async (req, res) => {
  try {
    // Get MongoDB instance
    const { mongoDB: mongoDatabase } = require('./config/database');
    
    // Test connection
    await mongoDatabase.admin().ping();
    
    // Get database stats
    const stats = await mongoDatabase.stats();
    
    // List collections
    const collections = await mongoDatabase.listCollections().toArray();
    
    res.json({
      status: '✅ MongoDB connection successful',
      database: mongoDatabase.databaseName,
      data: {
        collections: collections.length,
        collection_names: collections.map(col => col.name),
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        totalSize: stats.totalSize
      },
      connection_info: {
        uri: process.env.MONGO_URI,
        database: process.env.MONGO_DB_NAME
      }
    });
  } catch (error) {
    console.error('MongoDB test failed:', error);
    res.status(500).json({
      status: '❌ MongoDB connection failed',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    message: 'Check /api/test for available endpoints'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Background task for event reminders (runs every hour)
function startEventReminderTask() {
  setInterval(async () => {
    try {
      const reminders = await createEventReminders();
      if (reminders > 0) {
        console.log(`📬 Sent ${reminders} event reminders`);
      }
    } catch (error) {
      console.error('⚠️ Event reminder task failed:', error.message);
    }
  }, 60 * 60 * 1000); // Run every hour
}

// Start the server with database initialization
async function startServer() {
  try {
    // Initialize database connections
    await initializeDatabases();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n🚀 iMobilize API Server Started');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Phase 5: Advanced Integration Complete`);
      console.log(`⏰ ${new Date().toLocaleString()}\n`);
      
      console.log('🔗 Quick Links:');
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   API Test: http://localhost:${PORT}/api/test`);
      console.log(`   Documentation: See README.md\n`);
      
      console.log('✅ Ready for frontend integration!');
      console.log('📖 Check README.md for complete API documentation\n');
      
      // Start background tasks
      console.log('⏰ Starting background services...');
      startEventReminderTask();
      console.log('✅ Event reminder service active\n');
    });
    
  } catch (error) {
    console.error('\n❌ Server startup failed:', error.message);
    console.error('💡 Check database connections and environment variables\n');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabaseConnections();
  console.log('✅ Server stopped\n');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabaseConnections();
  console.log('✅ Server stopped\n');
  process.exit(0);
});

// Start the server
startServer();