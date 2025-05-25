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
- **Security**: Helmet, CORS, Rate limiting, JWT (planned)
- **Development**: Nodemon for auto-restart
- **Environment**: dotenv for configuration

## 🗄️ Database Architecture

### PostgreSQL (Relational Data)
- **Purpose**: User accounts, events, groups, structured data
- **Database**: `imobilize`
- **Connection**: Connection pooling with `pg` driver
- **Schema**: Defined in `postgres_schema.sql`

### MongoDB (Document Storage)
- **Purpose**: Messages, documents, activity logs, encrypted content
- **Database**: `imobilize` 
- **Connection**: Native MongoDB driver with connection pooling
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
   # Edit .env with your database credentials
   ```

4. **Create databases**:
   ```bash
   # PostgreSQL
   psql -U postgres -c "CREATE DATABASE imobilize;"
   
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
PG_PASSWORD=your_password
PG_DATABASE=imobilize

# MongoDB Configuration  
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=imobilize

# JWT Configuration (for authentication)
JWT_SECRET=your-super-secure-jwt-secret-key
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

### Authentication System

| Endpoint | Method | Description | Status |
|----------|--------|-------------|---------|
| `/api/auth/register` | POST | User registration | 🚧 Placeholder |
| `/api/auth/login` | POST | User authentication | 🚧 Placeholder |
| `/api/auth/verify` | GET | Token verification | 🚧 Placeholder |
| `/api/auth/logout` | POST | User logout | 🚧 Placeholder |

## 🔧 Core Components

### 1. Database Configuration (`config/database.js`)

**Purpose**: Manages database connections and initialization

**Key Features**:
- PostgreSQL connection pooling (max 20 connections)
- MongoDB connection with proper timeout settings
- Database health testing functions
- Graceful connection cleanup
- Comprehensive error handling

**Key Functions**:
```javascript
initializeDatabases()     // Initialize both database connections
closeDatabaseConnections() // Gracefully close all connections
testPostgreSQLConnection() // Test PostgreSQL connectivity
testMongoDBConnection()    // Test MongoDB connectivity
```

### 2. Main Server (`server.js`)

**Purpose**: Express.js application setup and configuration

**Middleware Stack**:
1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Express.json** - JSON body parsing
4. **Rate Limiting** - Request throttling (100 req/15min)

**Features**:
- Database connection initialization on startup
- Comprehensive error handling
- Graceful shutdown on SIGTERM/SIGINT
- Development-friendly logging
- Environment-based configuration

### 3. Authentication System (Planned)

**Location**: `routes/auth.js` and `middleware/auth.js`

**Status**: Placeholder structure created for security team member

**Planned Features**:
- User registration with validation
- Secure login with JWT tokens
- Token verification middleware
- Role-based access control
- Password hashing with bcrypt
- Rate limiting for auth endpoints

## 🛡️ Security Features

### Current Security Measures

1. **Helmet.js** - Sets security-related HTTP headers
2. **CORS** - Configured for development and production origins
3. **Rate Limiting** - Prevents abuse (100 requests per 15 minutes)
4. **Input Validation** - JSON body size limits (10MB)
5. **Environment Variables** - Sensitive data stored securely

### Planned Security Features

- JWT token authentication
- Password hashing (bcrypt)
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- End-to-end encryption for sensitive data

## 📊 Database Schema Overview

### PostgreSQL Tables
- `users` - User accounts and profiles
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
      "collections": 0,
      "dataSize": 0
    }
  }
}
```

## 🧪 Testing

### Manual Testing

**Test database connections**:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/test/postgresql
curl http://localhost:3000/api/test/mongodb
```

**Test authentication placeholders**:
```bash
curl -X POST http://localhost:3000/api/auth/register
curl -X POST http://localhost:3000/api/auth/login
curl http://localhost:3000/api/auth/verify
```

### Automated Testing (Planned)
- Unit tests for database functions
- Integration tests for API endpoints
- Security penetration testing
- Load testing for performance

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
4. **Test endpoints** using browser or API client
5. **Check logs** in terminal for debugging
6. **Commit changes** when stable

## 🚧 Current Limitations

1. **Authentication**: Placeholder implementation only
2. **Data Validation**: Basic validation, needs enhancement
3. **Testing**: No automated test suite yet
4. **Logging**: Console logging only, needs structured logging
5. **Documentation**: API documentation needs OpenAPI/Swagger spec

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Errors**:
- Verify PostgreSQL and MongoDB are running
- Check connection credentials in `.env`
- Ensure databases exist and are accessible

**Port Already in Use**:
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill the process
taskkill /PID <process_id> /F
```

**Module Import Errors**:
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version compatibility

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

## 📈 Performance Considerations

- **Connection Pooling**: PostgreSQL uses connection pooling (max 20)
- **MongoDB Connections**: Optimized for concurrent operations
- **Rate Limiting**: Prevents API abuse
- **Memory Usage**: JSON body size limited to 10MB
- **Graceful Shutdown**: Ensures clean database disconnection

## 🤝 Contributing

### For Team Members

1. **Authentication System**: Implement security features in `/routes/auth.js`
2. **API Endpoints**: Add new routes for events, resources, forums
3. **Database Schemas**: Extend schemas as needed for new features
4. **Testing**: Add comprehensive test coverage
5. **Documentation**: Update API documentation

### Code Style

- Use consistent error handling patterns
- Follow existing middleware structure
- Add comprehensive logging
- Include input validation
- Write clear, descriptive comments

## 📋 Roadmap

### Phase 1: Core Foundation ✅ Complete
- [x] Database connections (PostgreSQL + MongoDB)
- [x] Basic server setup with security middleware
- [x] Health monitoring endpoints
- [x] Development environment configuration

### Phase 2: Authentication System 🚧 In Progress
- [ ] User registration and login
- [ ] JWT token management
- [ ] Role-based access control
- [ ] Password security implementation

### Phase 3: Core API Features 📋 Planned
- [ ] Events management API
- [ ] User profiles and groups
- [ ] Educational resources API
- [ ] Forum and messaging system
- [ ] Document storage and permissions

### Phase 4: Advanced Features 🔮 Future
- [ ] Real-time messaging (WebSocket)
- [ ] Push notifications
- [ ] File upload and processing
- [ ] Advanced search functionality
- [ ] Analytics and reporting

## 📞 Support

For development questions or issues:
1. Check this documentation first
2. Review error logs in terminal
3. Test database connections using health endpoints
4. Consult team members for security implementations

---

**Last Updated**: May 25, 2025  
**Version**: 1.0.0  
**Team**: iMobilize Development Team