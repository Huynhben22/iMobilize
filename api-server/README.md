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

### 💬 Community Boards System

| Endpoint | Method | Description | Status |
|----------|--------|-------------|---------|
| `/api/community/forums` | GET | List all forums | ✅ **IMPLEMENTED** |
| `/api/community/forums` | POST | Create new forum | ✅ **IMPLEMENTED** |
| `/api/community/forums/:id` | GET | Get specific forum details | ✅ **IMPLEMENTED** |
| `/api/community/forums/:id/posts` | GET | List posts in forum | ✅ **IMPLEMENTED** |
| `/api/community/forums/:id/posts` | POST | Create new post in forum | ✅ **IMPLEMENTED** |
| `/api/community/posts/:id` | GET | Get post with comments | ✅ **IMPLEMENTED** |
| `/api/community/posts/:id/comments` | POST | Add comment to post | ✅ **IMPLEMENTED** |
| `/api/community/posts/:postId/comments/:commentId` | PUT | Update comment | ✅ **IMPLEMENTED** |
| `/api/community/posts/:postId/comments/:commentId` | DELETE | Delete comment | ✅ **IMPLEMENTED** |

### ⚖️ Legal Resources System

| Endpoint | Method | Description | Status |
|----------|--------|-------------|---------|
| `/api/legal/data` | GET | Legal documents and guides | ✅ **IMPLEMENTED** |
| `/api/legal/test/citations` | GET | Test RCW citations | ✅ **IMPLEMENTED** |

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

## 💬 Community Features

### ✅ **Implemented Community Features**

- **Forum Management**: Create and organize discussion forums
- **Post System**: Create, read, and organize posts within forums
- **Comment System**: Add comments with nested reply support
- **User Permissions**: Role-based access control for moderation
- **Content Moderation**: Pin posts, lock discussions
- **Pagination**: Efficient data loading for large discussions
- **Group Integration**: Private forums for specific groups

### 🛡️ **Community Security**
- **Rate Limiting**: 50 community requests, 10 posts per 15 minutes
- **Content Validation**: Title, content length and format validation
- **Author Permissions**: Users can only edit/delete their own content
- **Moderator Controls**: Enhanced permissions for content management
- **Nested Comments**: Organized reply threads with proper relationships

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

**User Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Community Testing

**List Forums:**
```bash
curl http://localhost:3000/api/community/forums
```

**Create Forum (requires auth token):**
```bash
curl -X POST http://localhost:3000/api/community/forums \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "General Discussion",
    "description": "Community discussion forum"
  }'
```

**Create Post:**
```bash
curl -X POST http://localhost:3000/api/community/forums/1/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Post",
    "content": "Welcome to our community!"
  }'
```

**Add Comment:**
```bash
curl -X POST http://localhost:3000/api/community/posts/1/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great post! Looking forward to the discussion."
  }'
```

### Windows PowerShell Testing

For Windows users, comprehensive PowerShell testing scripts are available:

```powershell
# Complete community API test
$userBody = @{
    username = "test_user_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPass123!"
    display_name = "API Test User"
    terms_accepted = "true"
} | ConvertTo-Json

$userResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $userBody -ContentType "application/json"
$token = $userResponse.data.token

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test forum creation, posts, and comments...
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

### 2. Authentication Middleware (`middleware/auth.js`)

**Purpose**: JWT token verification and user authentication

**Features**:
- JWT token validation
- User existence verification
- Role-based access control
- Comprehensive error handling

### 3. Route Handlers

**Authentication Routes (`routes/auth.js`)**:
- Complete user authentication system
- Registration, login, profile management
- Password security and validation
- Rate limiting protection

**Community Routes (`routes/community.js`)**:
- Full forum management system
- Post creation and management
- Comment system with nested replies
- Moderation and permission controls

**Legal Routes (`routes/legal.js`)**:
- Legal resource management
- RCW citation system
- Jurisdiction-specific content

### 4. Main Server (`server.js`)

**Purpose**: Express.js application setup and configuration

**Middleware Stack**:
1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Express.json** - JSON body parsing (10MB limit)
4. **Rate Limiting** - Request throttling

## 🛡️ Security Features

### Current Security Measures

1. **Helmet.js** - Sets security-related HTTP headers
2. **CORS** - Configured for development and production origins
3. **Rate Limiting** - Prevents abuse (100 requests per 15 minutes general, 50 community, 10 posts, 5 auth per 15 minutes)
4. **Input Validation** - Comprehensive validation with express-validator
5. **Password Security** - bcrypt hashing with 12 salt rounds
6. **JWT Authentication** - Secure token-based authentication
7. **SQL Injection Prevention** - Parameterized queries
8. **Environment Variables** - Sensitive data stored securely

### Community-Specific Security

- **Content Validation**: Post titles (3-100 chars), content (10-5000 chars), comments (1-1000 chars)
- **Author Verification**: Users can only modify their own content
- **Moderator Controls**: Enhanced permissions for content management
- **Rate Limiting**: Separate limits for posting vs browsing
- **Group Permissions**: Private forum access control

## 📊 Database Schema Overview

### PostgreSQL Tables
- `users` - User accounts and profiles ✅ **Active**
- `forums` - Discussion forums ✅ **Active**
- `forum_posts` - Posts within forums ✅ **Active**
- `post_comments` - Comments on posts ✅ **Active**
- `events` - Activism events and gatherings
- `groups` - User groups and organizations
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

### Community Response Examples

**Forum List Response:**
```json
{
  "success": true,
  "message": "Forums retrieved successfully",
  "data": {
    "forums": [
      {
        "id": 1,
        "title": "General Discussion",
        "description": "Community discussion forum",
        "post_count": 5,
        "moderator_username": "admin",
        "created_at": "2025-05-28T00:42:22.978Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0,
      "has_more": false
    }
  }
}
```

**Post with Comments Response:**
```json
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "post": {
      "id": 1,
      "title": "Welcome Post",
      "content": "Welcome to our community!",
      "author_username": "testuser",
      "created_at": "2025-05-28T00:42:22.978Z"
    },
    "comments": [
      {
        "id": 1,
        "content": "Great post!",
        "author_username": "commenter",
        "created_at": "2025-05-28T00:45:22.978Z",
        "replies": [
          {
            "id": 2,
            "content": "I agree!",
            "author_username": "replier",
            "created_at": "2025-05-28T00:50:22.978Z"
          }
        ]
      }
    ]
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
4. **Test endpoints** using curl, PowerShell, or API client
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
- [x] Forum creation and management
- [x] Post creation and retrieval
- [x] Comment system with nested replies
- [x] Content moderation features
- [x] Pagination support
- [x] Permission-based access control

### 🚧 **Pending Implementation**
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Account lockout after failed attempts
- [ ] Token refresh mechanism
- [ ] Events API
- [ ] Groups API
- [ ] Notifications system
- [ ] Search functionality
- [ ] File upload support
- [ ] Real-time updates (WebSockets)
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

### **Community API Issues**:
- **Forum Not Found**: Verify forum ID exists using `GET /api/community/forums`
- **Unauthorized**: Include valid JWT token in Authorization header
- **Rate Limited**: Wait 15 minutes before retrying post creation
- **Validation Errors**: Check content length requirements

## 📈 Performance Considerations

- **Connection Pooling**: PostgreSQL uses connection pooling (max 20)
- **MongoDB Connections**: Optimized for concurrent operations (max 10)
- **Rate Limiting**: Prevents API abuse and DOS attacks
- **Memory Usage**: JSON body size limited to 10MB
- **Graceful Shutdown**: Ensures clean database disconnection
- **Input Validation**: Early validation prevents unnecessary processing
- **Pagination**: Efficient loading of large forum datasets
- **Index Optimization**: Database queries optimized for performance

## 🎯 Development Phases

### ✅ Phase 1: Authentication Foundation - **COMPLETE**
- [x] Database connections (PostgreSQL + MongoDB)
- [x] Basic server setup with security middleware
- [x] Health monitoring endpoints
- [x] JWT authentication system
- [x] User registration and login
- [x] Password security and validation
- [x] Rate limiting and input validation

### ✅ Phase 2: Community Boards - **COMPLETE**
- [x] Forum management system
- [x] Post creation and management
- [x] Comment system with nested replies
- [x] Content moderation features
- [x] Pagination and filtering
- [x] Permission-based access control
- [x] Comprehensive testing and validation

### 🚧 Phase 3: Events & Groups - **IN PROGRESS**
- [ ] Events API for activism coordination
- [ ] Groups API for user organization
- [ ] Event-group relationships
- [ ] RSVP and attendance tracking
- [ ] Location-based event discovery

### 🚧 Phase 4: Advanced Features - **PLANNED**
- [ ] Real-time notifications
- [ ] File upload and sharing
- [ ] Search and filtering
- [ ] Email notifications
- [ ] Mobile push notifications
- [ ] Admin dashboard

---

**Last Updated**: May 28, 2025  
**Version**: 1.2.0  
**Status**: Authentication & Community Systems **COMPLETE** ✅  
**Team**: iMobilize Development Team

**🎉 Authentication and Community Boards systems are fully functional and production-ready!**

The API server now provides a solid foundation for social activism coordination with secure user management and robust community discussion features.