// config/database.js
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');

// PostgreSQL connection pool
const pgPool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
  // Connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return error after 2 seconds if connection could not be established
});

// MongoDB connection
let mongoClient;
let mongoDB;

async function connectMongoDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    mongoClient = new MongoClient(process.env.MONGO_URI, {
      // Connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    await mongoClient.connect();
    mongoDB = mongoClient.db(process.env.MONGO_DB_NAME);
    
    console.log('✅ MongoDB connected successfully');
    return mongoDB;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// Test PostgreSQL connection
async function testPostgreSQLConnection() {
  try {
    console.log('🔌 Testing PostgreSQL connection...');
    const client = await pgPool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as database_name');
    client.release();
    
    console.log('✅ PostgreSQL connected successfully');
    console.log(`   Database: ${result.rows[0].database_name}`);
    console.log(`   Time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
}

// Test MongoDB connection
async function testMongoDBConnection() {
  try {
    if (!mongoDB) {
      throw new Error('MongoDB not connected');
    }
    
    console.log('🔌 Testing MongoDB connection...');
    await mongoDB.admin().ping();
    
    console.log('✅ MongoDB connection test successful');
    console.log(`   Database: ${mongoDB.databaseName}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    throw error;
  }
}

// Initialize all database connections
async function initializeDatabases() {
  console.log('\n🚀 Initializing database connections...\n');
  
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Test PostgreSQL
    await testPostgreSQLConnection();
    
    // Test MongoDB
    await testMongoDBConnection();
    
    console.log('\n🎉 All database connections established successfully!\n');
    
    return { pgPool, mongoDB };
  } catch (error) {
    console.error('\n💥 Database initialization failed:', error.message);
    console.error('Please check your database configuration and ensure services are running.\n');
    throw error;
  }
}

// Graceful shutdown
async function closeDatabaseConnections() {
  console.log('\n🔌 Closing database connections...');
  
  try {
    if (pgPool) {
      await pgPool.end();
      console.log('✅ PostgreSQL pool closed');
    }
    
    if (mongoClient) {
      await mongoClient.close();
      console.log('✅ MongoDB connection closed');
    }
    
    console.log('🎉 All database connections closed gracefully\n');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
}

module.exports = {
  pgPool,
  mongoDB,
  initializeDatabases,
  closeDatabaseConnections,
  testPostgreSQLConnection,
  testMongoDBConnection
};