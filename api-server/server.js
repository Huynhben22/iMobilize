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
const communityRoutes = require('./routes/community'); // NEW

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
app.use('/api/community', communityRoutes); // NEW

// Basic Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 iMobilize API Server is running!',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    databases: {
      postgresql: '✅ Connected',
      mongodb: '✅ Connected'
    },
    endpoints: {
      health: '/health',
      test: '/api/test',
      postgresql_test: '/api/test/postgresql',
      mongodb_test: '/api/test/mongodb',
      
      // Authentication endpoints
      auth_register: '/api/auth/register',
      auth_login: '/api/auth/login',
      auth_verify: '/api/auth/verify',
      
      // Legal endpoints
      legal_data: '/api/legal/data',
      legal_test: '/api/legal/test/citations',
      
      // Community endpoints (NEW)
      community_forums: '/api/community/forums',
      community_create_forum: 'POST /api/community/forums',
      community_forum_posts: '/api/community/forums/:id/posts',
      community_create_post: 'POST /api/community/forums/:id/posts',
      community_get_post: '/api/community/posts/:id',
      community_add_comment: 'POST /api/community/posts/:id/comments'
    }
  });
});

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    // Test PostgreSQL
    const pgClient = await pgPool.connect();
    const pgResult = await pgClient.query('SELECT NOW() as current_time, current_database() as db_name');
    pgClient.release();
    
    // Test MongoDB
    const mongoDatabase = dbConfig.mongoDB;
    if (!mongoDatabase) {
      throw new Error('MongoDB not initialized');
    }
    
    await mongoDatabase.admin().ping();
    const mongoStats = await mongoDatabase.stats();
    
    res.json({ 
      status: '✅ Healthy', 
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      databases: {
        postgresql: {
          status: '✅ Connected',
          database: pgResult.rows[0].db_name,
          current_time: pgResult.rows[0].current_time
        },
        mongodb: {
          status: '✅ Connected',
          database: mongoDatabase.databaseName,
          collections: mongoStats.collections || 0,
          dataSize: mongoStats.dataSize || 0
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: '❌ Unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({
    message: '✅ API is working correctly!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    server: 'iMobilize API v1.1.0'
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
    error: '❌ Route not found',
    path: req.originalUrl,
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/test',
      'GET /api/test/postgresql',
      'GET /api/test/mongodb',
      
      // Authentication
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/verify',
      
      // Community
      'GET /api/community/forums',
      'POST /api/community/forums',
      'GET /api/community/forums/:id',
      'GET /api/community/forums/:id/posts',
      'POST /api/community/forums/:id/posts',
      'GET /api/community/posts/:id',
      'POST /api/community/posts/:id/comments'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Error occurred:', err);
  res.status(500).json({ 
    error: '💥 Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server with database initialization
async function startServer() {
  try {
    // Initialize database connections
    await initializeDatabases();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n🎉 iMobilize API Server started successfully!');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
      
      console.log('📋 Available endpoints:');
      console.log(`   🏠 GET  /                          - Server status & info`);
      console.log(`   💗 GET  /health                    - Health check with DB status`);
      console.log(`   🧪 GET  /api/test                  - API test`);
      console.log(`   🐘 GET  /api/test/postgresql       - PostgreSQL connection test`);
      console.log(`   🍃 GET  /api/test/mongodb          - MongoDB connection test\n`);
      
      console.log('🔐 Authentication endpoints:');
      console.log(`   📝 POST /api/auth/register         - User registration`);
      console.log(`   🔐 POST /api/auth/login            - User login`);
      console.log(`   ✅ GET  /api/auth/verify           - Token verification`);
      console.log(`   🚪 POST /api/auth/logout           - User logout`);
      console.log(`   👤 PUT  /api/auth/profile          - Update profile\n`);
      
      console.log('⚖️  Legal endpoints:');
      console.log(`   📚 GET  /api/legal/data            - Legal documents`);
      console.log(`   🧪 GET  /api/legal/test/citations  - Test RCW citations\n`);
      
      console.log('💬 Community endpoints (NEW!):');
      console.log(`   📋 GET  /api/community/forums                 - List all forums`);
      console.log(`   ➕ POST /api/community/forums                 - Create new forum`);
      console.log(`   🔍 GET  /api/community/forums/:id             - Get specific forum`);
      console.log(`   📝 GET  /api/community/forums/:id/posts       - Get forum posts`);
      console.log(`   ➕ POST /api/community/forums/:id/posts       - Create new post`);
      console.log(`   📖 GET  /api/community/posts/:id              - Get post with comments`);
      console.log(`   💬 POST /api/community/posts/:id/comments     - Add comment to post`);
      console.log(`   ✏️  PUT  /api/community/posts/:postId/comments/:commentId - Update comment`);
      console.log(`   🗑️  DELETE /api/community/posts/:postId/comments/:commentId - Delete comment\n`);
      
      console.log('🎯 Try visiting: http://localhost:3000');
      console.log('🎯 Or test health: http://localhost:3000/health');
      console.log('🎯 Community forums: http://localhost:3000/api/community/forums\n');
    });
    
  } catch (error) {
    console.error('\n💥 Failed to start server:', error.message);
    console.error('🔧 Please check your database configuration and ensure services are running.\n');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  await closeDatabaseConnections();
  process.exit(0);
});

// Start the server
startServer();