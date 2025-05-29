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
  - PostgreSQL 17.5 (relational data, user management, events)
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

### 📅 Events Management System

| Endpoint | Method | Description | Status |
|----------|--------|-------------|---------|
| `/api/events` | GET | List public events with pagination | ✅ **IMPLEMENTED** |
| `/api/events` | POST | Create new event | ✅ **IMPLEMENTED** |
| `/api/events/:id` | GET | Get specific event with participants | ✅ **IMPLEMENTED** |
| `/api/events/:id/join` | POST | Join an event | ✅ **IMPLEMENTED** |
| `/api/events/:id/leave` | DELETE | Leave an event | ✅ **IMPLEMENTED** |

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

## 📅 Events Management Features

### ✅ **Implemented Events Features**

- **Event Creation**: Create public and private events with comprehensive details
- **Event Discovery**: List public events with pagination and filtering
- **Event Participation**: Users can join and leave events seamlessly
- **Private Events**: Access code protection for confidential gatherings
- **Organizer Controls**: Automatic organizer participation and special privileges
- **Participant Tracking**: Real-time participant counts and role management
- **Date Validation**: Events must be scheduled in the future
- **Location Support**: Flexible location descriptions for event venues

### 🛡️ **Events Security & Validation**
- **Rate Limiting**: 100 general requests, 10 event creations per 15 minutes per IP
- **Input Validation**: 
  - Title: 3-100 characters
  - Description: 10-5000 characters
  - Location: Up to 500 characters
  - Access codes: 4-20 characters for private events
- **Time Validation**: Start time must be in future, end time after start time
- **Access Control**: Private events require correct access codes
- **Permission Management**: Organizers cannot leave their own events
- **Authentication**: JWT tokens required for create, join, and leave operations

### 📊 **Events Data Model**
```sql
-- Core event information
events: id, title, description, start_time, end_time, location_description, 
        organizer_id, is_private, access_code, status, created_at, updated_at

-- Participant tracking  
event_participants: id, event_id, user_id, role, status, registered_at
```

### 🎯 **Events Use Cases**
- **Activism Rallies**: Organize public demonstrations and marches
- **Strategy Meetings**: Private planning sessions with access codes
- **Community Workshops**: Educational events with participant limits
- **Volunteer Coordination**: Organize volunteer activities and cleanups
- **Awareness Campaigns**: Public events to raise awareness on issues

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

### Events Testing

**List Events:**
```bash
curl http://localhost:3000/api/events
```

**Create Event (requires auth token):**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Action Rally",
    "description": "Join us for a peaceful rally to raise awareness about climate change...",
    "start_time": "2025-06-15T10:00:00.000Z",
    "end_time": "2025-06-15T14:00:00.000Z",
    "location_description": "Central Park Main Entrance",
    "is_private": false
  }'
```

**Join Event:**
```bash
curl -X POST http://localhost:3000/api/events/1/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Join Private Event (with access code):**
```bash
curl -X POST http://localhost:3000/api/events/2/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "access_code": "STRATEGY2025"
  }'
```

### Comprehensive Testing Scripts

**PowerShell (Windows):**
```powershell
# Complete automated testing with 15 test scenarios
.\test-events-api.ps1
```

**Bash (Linux/Mac):**
```bash
# Basic functionality testing
chmod +x test-events-api.sh
./test-events-api.sh
```

### Windows PowerShell Testing

For Windows users, comprehensive PowerShell testing scripts are available:

```powershell
# Complete events API test covering all endpoints
$userBody = @{
    username = "test_user_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPass123!"
    display_name = "API Test User"
    terms_accepted = "true"
} | ConvertTo-Json

$userResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $userBody -ContentType "application/json"
$token = $userResponse.data.token

# Test event creation, joining, private events, validation, and rate limiting...
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

**Events Routes (`routes/events.js`)**:
- Complete event lifecycle management
- Public and private event support
- Participant management system
- Organizer privilege controls
- Comprehensive validation and security

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
3. **Rate Limiting** - Prevents abuse:
   - General: 100 requests per 15 minutes
   - Community: 50 requests per 15 minutes
   - Posts: 10 posts per 15 minutes
   - Events: 10 creations per 15 minutes
   - Auth: 5 attempts per 15 minutes
4. **Input Validation** - Comprehensive validation with express-validator
5. **Password Security** - bcrypt hashing with 12 salt rounds
6. **JWT Authentication** - Secure token-based authentication
7. **SQL Injection Prevention** - Parameterized queries
8. **Environment Variables** - Sensitive data stored securely

### Events-Specific Security

- **Content Validation**: Event titles (3-100 chars), descriptions (10-5000 chars), locations (≤500 chars)
- **Time Validation**: Events must be scheduled in the future, end after start
- **Access Control**: Private events require correct access codes
- **Permission Checks**: Organizers cannot leave their own events
- **Rate Limiting**: Separate limits for creation vs. browsing
- **Participant Verification**: Users cannot join same event multiple times

## 📊 Database Schema Overview

### PostgreSQL Tables
- `users` - User accounts and profiles ✅ **Active**
- `events` - Event information and scheduling ✅ **Active**
- `event_participants` - Event participation tracking ✅ **Active**
- `forums` - Discussion forums ✅ **Active**
- `forum_posts` - Posts within forums ✅ **Active**
- `post_comments` - Comments on posts ✅ **Active**
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

### Events Response Examples

**Event List Response:**
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Climate Action Rally",
        "description": "Join us for a peaceful rally...",
        "start_time": "2025-06-15T10:00:00.000Z",
        "end_time": "2025-06-15T14:00:00.000Z",
        "location_description": "Central Park Main Entrance",
        "status": "upcoming",
        "organizer_username": "activist_leader",
        "organizer_display_name": "Environmental Leader",
        "participant_count": 25,
        "created_at": "2025-05-29T09:42:22.978Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  }
}
```

**Event Details Response:**
```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "event": {
      "id": 1,
      "title": "Climate Action Rally",
      "description": "Join us for a peaceful rally to raise awareness...",
      "start_time": "2025-06-15T10:00:00.000Z",
      "end_time": "2025-06-15T14:00:00.000Z",
      "location_description": "Central Park Main Entrance",
      "is_private": false,
      "status": "upcoming",
      "organizer_username": "activist_leader",
      "organizer_display_name": "Environmental Leader",
      "created_at": "2025-05-29T09:42:22.978Z"
    },
    "participants": [
      {
        "role": "organizer",
        "status": "confirmed",
        "username": "activist_leader",
        "display_name": "Environmental Leader",
        "registered_at": "2025-05-29T09:42:22.978Z"
      },
      {
        "role": "attendee",
        "status": "confirmed",
        "username": "volunteer123",
        "display_name": "Community Volunteer",
        "registered_at": "2025-05-29T10:15:33.445Z"
      }
    ]
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
- [x] **Event creation and management** ✅ **NEW**
- [x] **Event participation (join/leave)** ✅ **NEW**
- [x] **Private events with access codes** ✅ **NEW**
- [x] **Event pagination and filtering** ✅ **NEW**
- [x] **Organizer privilege controls** ✅ **NEW**
- [x] **Comprehensive event validation** ✅ **NEW**
- [x] **Event-specific rate limiting** ✅ **NEW**

### 🚧 **Pending Implementation**
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Account lockout after failed attempts
- [ ] Token refresh mechanism
- [ ] Groups API
- [ ] Notifications system
- [ ] Search functionality
- [ ] File upload support
- [ ] Real-time updates (WebSockets)
- [ ] Automated testing suite
- [ ] Event updates (PUT endpoints)
- [ ] Event categories and tags
- [ ] Recurring events
- [ ] Event analytics and reporting

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

### **Events API Issues**:
- **Event Not Found**: Verify event ID exists using `GET /api/events`
- **Cannot Join Event**: Check if event is upcoming and you're not already registered
- **Private Event Access**: Include correct access_code in request body
- **Date Validation**: Ensure start_time is in future and end_time is after start_time
- **Rate Limited**: Wait 15 minutes before creating more events (limit: 10 per 15min)

## 📈 Performance Considerations

- **Connection Pooling**: PostgreSQL uses connection pooling (max 20)
- **MongoDB Connections**: Optimized for concurrent operations (max 10)
- **Rate Limiting**: Prevents API abuse and DOS attacks
- **Memory Usage**: JSON body size limited to 10MB
- **Graceful Shutdown**: Ensures clean database disconnection
- **Input Validation**: Early validation prevents unnecessary processing
- **Pagination**: Efficient loading of large datasets (forums, events)
- **Index Optimization**: Database queries optimized for performance
- **Event Queries**: Optimized participant counting and event filtering

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

### ✅ Phase 3: Events Management - **COMPLETE**
- [x] Event creation and listing system
- [x] Public and private event support
- [x] Event participation management (join/leave)
- [x] Organizer privilege controls
- [x] Access code protection for private events
- [x] Comprehensive validation and security
- [x] Pagination and filtering
- [x] Complete testing suite (15 test scenarios)

### 🚧 Phase 4: Groups & Advanced Events - **IN PROGRESS**
- [ ] Groups API for user organization
- [ ] Event-group relationships
- [ ] Advanced event features (updates, categories)
- [ ] Event search and filtering
- [ ] RSVP management and waiting lists

### 🚧 Phase 5: Advanced Features - **PLANNED**
- [ ] Real-time notifications
- [ ] File upload and sharing
- [ ] Email notifications
- [ ] Mobile push notifications
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Advanced search across all content

---

**Last Updated**: May 29, 2025  
**Version**: 1.3.0  
**Status**: Authentication, Community & Events Systems **COMPLETE** ✅  
**Team**: iMobilize Development Team

**🎉 Authentication, Community Boards, and Events Management systems are fully functional and production-ready!**

The API server now provides a comprehensive foundation for social activism coordination with secure user management, robust community discussion features, and complete event lifecycle management. The Events API supports both public rallies and private strategy meetings, with comprehensive security and validation measures.

### 🚀 **Latest Addition: Events Management System**
- **Full CRUD Operations**: Create, read, update participation for events
- **Public & Private Events**: Support for both open rallies and confidential meetings
- **Access Code Protection**: Secure private events with access codes
- **Comprehensive Validation**: Date validation, content length checks, future scheduling
- **Rate Limiting**: Prevents abuse with 10 events per 15 minutes per user
- **Participant Management**: Join/leave functionality with role tracking
- **Organizer Controls**: Special privileges and automatic participation
- **Production Testing**: 15 comprehensive test scenarios all passing ✅

**Ready for frontend integration and user testing!** 🚀