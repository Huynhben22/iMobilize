# iMobilize API Server

A comprehensive RESTful API server for the iMobilize social activism platform, built with Node.js, Express.js, PostgreSQL, and MongoDB.

## 🏗️ Architecture Overview

The iMobilize API server follows a modular architecture with clear separation of concerns:

```
api-server/
├── config/              # Database and configuration
├── middleware/          # Custom middleware (auth, validation)
├── routes/              # API route handlers
├── security/            # Security implementations
├── .env                 # Environment variables (not committed)
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
├── server.js            # Main application entry point
└── README.md           # This documentation
```

## 🔧 Technology Stack

- **Runtime**: Node.js (v22.16.0+)
- **Framework**: Express.js (v4.19.2)
- **Databases**: 
  - PostgreSQL 17.5 (relational data, user management)
  - MongoDB 8.0.9 (document storage, encrypted content)
- **Security**: Helmet, CORS, Rate limiting, JWT authentication
- **Authentication**: bcryptjs (12 salt rounds), jsonwebtoken
- **Validation**: express-validator
- **Development**: Nodemon for auto-restart
- **Environment**: dotenv for configuration

## 🗄️ Database Architecture

### PostgreSQL (Relational Data)
- **Purpose**: User accounts, events, groups, structured data
- **Database**: `imobilize`
- **Connection**: Connection pooling with `pg` driver (max 20 connections)
- **Schema**: Defined in `schema.sql`

### MongoDB (Document Storage)
- **Purpose**: Messages, documents, activity logs, encrypted content
- **Database**: `imobilize` 
- **Connection**: Native MongoDB driver with connection pooling (max 10 connections)
- **Schema**: Defined in `mongo_schema.sql`

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ and npm v10+
- PostgreSQL 17+ installed and running
- MongoDB 8.0+ installed and running

### Installation

1. **Clone and navigate to API server**:
   ```bash
   cd iMobilize/api-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

4. **Create and setup databases**:
   ```bash
   # PostgreSQL
   psql -U postgres -c "CREATE DATABASE imobilize;"
   psql -U postgres -d imobilize -f schema.sql
   
   # MongoDB (creates automatically on first connection)
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Environment Configuration

Required environment variables in `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_DATABASE=imobilize

# MongoDB Configuration  
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=imobilize

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# CORS Configuration
CORS_ORIGIN=http://localhost:19006,http://localhost:3001
CORS_CREDENTIALS=true
```

## 📚 API Documentation

### Server Information

| Endpoint | Method | Description | Status |
|----------|--------|-------------|---------|
| `/` | GET | Server status and information | ✅ Active |
| `/health` | GET | Database health check | ✅ Active |
| `/api/test` | GET | API functionality test | ✅ Active |

### Database Testing

| Endpoint | Method | Description | Status |
|----------|--------|-------------|---------|
| `/api/test/postgresql` | GET | PostgreSQL connection test | ✅ Active |
| `/api/test/mongodb` | GET | MongoDB connection test | ✅ Active |

### 🔐 Authentication System

| Endpoint | Method | Description | Status |
|----------|--------|-------------|---------|
| `/api/auth/register` | POST | User registration | ✅ **IMPLEMENTED** |
| `/api/auth/login` | POST | User authentication | ✅ **IMPLEMENTED** |
| `/api/auth/verify` | GET | Token verification | ✅ **IMPLEMENTED** |
| `/api/auth/logout` | POST | User logout | ✅ **IMPLEMENTED** |
| `/api/auth/profile` | PUT | Update user profile | ✅ **IMPLEMENTED** |
| `/api/auth/forgot-password` | POST | Password reset initiation | 🚧 Placeholder |
| `/api/auth/reset-password` | POST | Password reset completion | 🚧 Placeholder |

## 🔒 Authentication Features

### ✅ **Implemented Security Features**

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: 24-hour expiration, secure generation
- **Input Validation**: Comprehensive field validation with express-validator
- **Rate Limiting**: 5 auth attempts per 15 minutes per IP
- **User Registration**: Complete with validation and duplicate checking
- **User Authentication**: Secure login with credential verification
- **Token Verification**: Middleware for protected routes
- **Profile Updates**: Secure user profile modification
- **Database Security**: Parameterized queries prevent SQL injection

### 🔐 **Password Requirements**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character (@$!%*?&)

### 🔑 **Username Requirements**
- 3-50 characters
- Letters, numbers, underscores, and hyphens only
- Must be unique

## 🧪 Testing the API

### Quick Health Check
```bash
curl http://localhost:3000/health
```

### Authentication Testing

**User Registration:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "display_name": "Test User",
    "terms_accepted": "true"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "display_name": "Test User",
      "role": "user",
      "privacy_level": "standard"
    }
  }
}
```

**User Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Token Verification:**
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Profile Update:**
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Updated Name",
    "bio": "Updated bio text"
  }'
```

### Windows-Friendly Testing Commands

For Windows Command Prompt (single line):
```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"username\": \"testuser\", \"email\": \"test@example.com\", \"password\": \"TestPass123!\", \"display_name\": \"Test User\", \"terms_accepted\": \"true\"}"
```

## 🔧 Core Components

### 1. Database Configuration (`config/database.js`)

**Purpose**: Manages database connections and initialization

**Key Features**:
- PostgreSQL connection pooling (max 20 connections)
- MongoDB connection with proper timeout settings
- Database health testing functions
- Graceful connection cleanup
- Helper functions to prevent connection redeclaration

**Key Functions**:
```javascript
initializeDatabases()         // Initialize both database connections
closeDatabaseConnections()    // Gracefully close all connections
getPostgreSQLPool()          // Get PostgreSQL connection pool
getMongoDatabase()           // Get MongoDB database instance
testPostgreSQLConnection()   // Test PostgreSQL connectivity
testMongoDBConnection()      // Test MongoDB connectivity
```

### 2. Authentication Middleware (`middleware/auth.js`)

**Purpose**: JWT token verification and user authentication

**Features**:
- JWT token validation
- User existence verification
- Role-based access control
- Comprehensive error handling

**Functions**:
```javascript
verifyToken(req, res, next)  // Verify JWT token middleware
requireRole(roles)           // Role-based access control
```

### 3. Authentication Routes (`routes/auth.js`)

**Purpose**: Complete user authentication system

**Features**:
- User registration with validation
- Secure login with password verification
- Token verification
- Profile updates
- Rate limiting protection
- Input sanitization

### 4. Main Server (`server.js`)

**Purpose**: Express.js application setup and configuration

**Middleware Stack**:
1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Express.json** - JSON body parsing (10MB limit)
4. **Rate Limiting** - Request throttling (100 req/15min, 5 auth req/15min)

**Features**:
- Database connection initialization on startup
- Comprehensive error handling
- Graceful shutdown on SIGTERM/SIGINT
- Development-friendly logging
- Environment-based configuration

## 🛡️ Security Features

### Current Security Measures

1. **Helmet.js** - Sets security-related HTTP headers
2. **CORS** - Configured for development and production origins
3. **Rate Limiting** - Prevents abuse (100 requests per 15 minutes, 5 auth per 15 minutes)
4. **Input Validation** - Comprehensive validation with express-validator
5. **Password Security** - bcrypt hashing with 12 salt rounds
6. **JWT Authentication** - Secure token-based authentication
7. **SQL Injection Prevention** - Parameterized queries
8. **Environment Variables** - Sensitive data stored securely

### Authentication Security

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure generation with configurable expiration
- **Rate Limiting**: 5 authentication attempts per 15 minutes per IP
- **Input Validation**: Comprehensive field validation and sanitization
- **User Verification**: Token-based user existence checking
- **Secure Headers**: Helmet.js security headers

## 📊 Database Schema Overview

### PostgreSQL Tables
- `users` - User accounts and profiles ✅ **Active**
- `events` - Activism events and gatherings
- `groups` - User groups and organizations
- `forums` - Discussion forums
- `resources` - Educational resources
- `locations` - Geographic locations

### MongoDB Collections
- `chat_messages` - Encrypted messaging
- `documents` - File storage with permissions
- `activity_logs` - User activity tracking
- `educational_resources` - Learning materials
- `safety_protocols` - Emergency procedures

## 🔍 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {
    // Additional error information
  }
}
```

### Health Check Response
```json
{
  "status": "✅ Healthy",
  "timestamp": "2025-05-25T20:00:00.000Z",
  "uptime": 3600,
  "databases": {
    "postgresql": {
      "status": "✅ Connected",
      "database": "imobilize",
      "current_time": "2025-05-25T20:00:00.000Z"
    },
    "mongodb": {
      "status": "✅ Connected",
      "database": "imobilize",
      "collections": 5,
      "dataSize": 408
    }
  }
}
```

## 📜 Available Scripts

```json
{
  "start": "node server.js",           // Production server
  "dev": "nodemon server.js",          // Development with auto-restart
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## 🔄 Development Workflow

1. **Start development server**: `npm run dev`
2. **Make changes** to routes, middleware, or configuration
3. **Server automatically restarts** with nodemon
4. **Test endpoints** using curl or API client
5. **Check logs** in terminal for debugging
6. **Commit changes** when stable

## 🧪 Testing Checklist

### ✅ **Completed & Working**
- [x] Server startup and database connections
- [x] Health check endpoints
- [x] User registration with validation
- [x] User login with authentication
- [x] JWT token generation and verification
- [x] Password hashing and security
- [x] Profile updates
- [x] Rate limiting
- [x] Input validation and sanitization
- [x] Error handling and responses

### 🚧 **Pending Implementation**
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Account lockout after failed attempts
- [ ] Token refresh mechanism
- [ ] Advanced user management
- [ ] Automated testing suite

## 🚨 Common Issues & Solutions

### **Database Connection Errors**:
- Verify PostgreSQL and MongoDB are running
- Check connection credentials in `.env`
- Ensure databases exist and are accessible

### **JWT Secret Missing**:
```bash
# Add to .env file
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
```

### **Port Already in Use**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### **Module Import Errors**:
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version compatibility (v20+)

### **CORS Errors (Frontend)**:
Add your frontend URL to `.env`:
```env
CORS_ORIGIN=http://localhost:19006,http://localhost:3001,http://your-frontend-url
```

## 📈 Performance Considerations

- **Connection Pooling**: PostgreSQL uses connection pooling (max 20)
- **MongoDB Connections**: Optimized for concurrent operations (max 10)
- **Rate Limiting**: Prevents API abuse and DOS attacks
- **Memory Usage**: JSON body size limited to 10MB
- **Graceful Shutdown**: Ensures clean database disconnection
- **Input Validation**: Early validation prevents unnecessary processing

### ✅ Phase 1: Authentication Foundation - **COMPLETE**
- [x] Database connections (PostgreSQL + MongoDB)
- [x] Basic server setup with security middleware
- [x] Health monitoring endpoints
- [x] JWT authentication system
- [x] User registration and login
- [x] Password security and validation
- [x] Rate limiting and input validation
---

**Last Updated**: May 26, 2025  
**Version**: 1.1.0  
**Status**: Authentication System **COMPLETE** ✅  
**Team**: iMobilize Development Team

**🎉 Authentication system is fully functional and production-ready!**