# iMobilize API Server

A comprehensive RESTful API server for social activism coordination, built with Node.js, Express.js, PostgreSQL, and MongoDB.

**🎯 Status**: Phase 5 Complete - Advanced Integration Ready for Production

---

## 🏗️ Architecture

```
api-server/
├── config/              # Database configuration
├── middleware/          # Authentication & validation
├── routes/              # API endpoints
├── server.js            # Main application
└── schema.sql          # Database schema
```

**Design Pattern**: Modular MVC architecture with clear separation of concerns
- **Routes**: Handle HTTP requests and responses
- **Middleware**: Authentication, validation, rate limiting
- **Config**: Database connections and environment management
- **Security**: JWT authentication, input validation, SQL injection prevention

---

## 🔧 Tech Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | v22.16.0+ | Server runtime |
| **Framework** | Express.js | v4.19.2 | Web framework |
| **Database** | PostgreSQL | 17.5 | Relational data (users, events, groups) |
| **Database** | MongoDB | 8.0.9 | Document storage (messages, logs) |
| **Authentication** | JWT + bcrypt | Latest | Secure user authentication |
| **Validation** | express-validator | Latest | Input validation |
| **Security** | Helmet + CORS | Latest | Security headers & CORS |
| **Development** | Nodemon | Latest | Auto-restart during development |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ and npm v10+
- PostgreSQL 17+ running on port 5432
- MongoDB 8.0+ running on port 27017

### Quick Setup
```bash
# 1. Navigate to API server
cd iMobilize/api-server

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Create databases
psql -U postgres -c "CREATE DATABASE imobilize;"
psql -U postgres -d imobilize -f schema.sql

# 5. Start development server
npm run dev
```

### Verify Installation
```bash
# Check server health
curl http://localhost:3000/health

# Test API functionality
curl http://localhost:3000/api/test
```

---

## ⚙️ Environment Configuration

### Required `.env` Variables
```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_DATABASE=imobilize

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=imobilize

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:19006,http://localhost:3001
```

### Security Requirements
- **JWT Secret**: Minimum 32 characters, cryptographically secure
- **Passwords**: 8+ chars with uppercase, lowercase, number, special character
- **Rate Limiting**: Automatic protection against API abuse

---

## 📚 API Documentation

### Base URL: `http://localhost:3000`

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/verify` | GET | Token verification |
| `/api/auth/profile` | PUT | Update profile |

### Groups Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/groups` | GET | List groups |
| `/api/groups` | POST | Create group |
| `/api/groups/:id` | GET | Get group details |
| `/api/groups/:id/join` | POST | Join group |
| `/api/groups/:id/members` | GET | List members |
| `/api/groups/my-groups` | GET | User's groups |

### Events Coordination
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | List events with filtering |
| `/api/events` | POST | Create event |
| `/api/events/:id` | GET | Get event details |
| `/api/events/:id/join` | POST | Join event |
| `/api/events/groups/:groupId/events` | GET | Group events |

### Community Forums
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/community/forums` | GET | List forums |
| `/api/community/forums` | POST | Create forum |
| `/api/community/forums/:id/posts` | GET | Forum posts |
| `/api/community/posts/:id/comments` | POST | Add comment |

### Notifications
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | Get notifications |
| `/api/notifications/:id/read` | PUT | Mark as read |
| `/api/notifications/read-all` | PUT | Mark all read |

### Query Parameters & Filtering
```bash
# Event filtering
GET /api/events?category=rally&group_id=1&location=downtown

# Pagination
GET /api/events?limit=10&offset=20

# Group search
GET /api/groups?search=climate&limit=5

# Notifications filtering
GET /api/notifications?unread_only=true&type=event_created
```

### Example Request/Response
```bash
# Create group event
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Action Rally",
    "description": "Join us for climate justice",
    "start_time": "2025-06-15T10:00:00.000Z",
    "end_time": "2025-06-15T14:00:00.000Z",
    "location_description": "City Hall Steps",
    "organizing_group_id": 1,
    "category": "rally"
  }'

# Response
{
  "success": true,
  "message": "Group event created successfully",
  "data": {
    "event": {
      "id": 18,
      "title": "Climate Action Rally",
      "organizing_group_id": 1,
      "category": "rally",
      "created_at": "2025-05-30T14:00:00.000Z"
    }
  }
}
```

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with 24-hour token expiration
- **bcrypt password hashing** with 12 salt rounds
- **Rate limiting** to prevent API abuse
- **Input validation** and SQL injection prevention
- **Role-based access control** (admin, moderator, member)

### 👥 Group Management
- **Create public/private groups** for organizing activists
- **Role hierarchy** with member, moderator, and admin permissions
- **Group search and discovery** with pagination
- **Member management** including role promotion/demotion
- **Private group protection** with access controls

### 📅 Event Coordination
- **Group-organized events** with automatic member notifications
- **Event categories**: rally, meeting, training, action, fundraiser, social
- **Advanced filtering** by group, category, location, membership
- **Private events** with access code protection
- **Participant management** with join/leave functionality

### 💬 Community Forums
- **Discussion forums** with nested comment threads
- **Group-specific forums** for private organizing
- **Content moderation** with pin/lock capabilities
- **User permissions** for editing own content

### 🔔 Notifications System
- **Real-time alerts** for group activities and events
- **Event reminders** sent 24 hours before start time
- **Notification types**: event_created, group_joined, forum_post
- **Smart filtering** by type, read status, and date
- **Auto-expiration** for time-sensitive notifications

### 🔍 Advanced Search
- **Cross-system filtering** across events, groups, and forums
- **Category-based discovery** for finding relevant activities
- **Location search** for geographically relevant events
- **"My Groups" filtering** for personalized content
- **Pagination support** for large datasets

### 📊 Legal Resources
- **Jurisdiction-specific legal guides** for activist rights
- **RCW citation system** for Washington State laws
- **Verified legal content** with source attribution

---

## 🧪 Testing

### Test Scripts
```bash
# Authentication system
.\test-auth-api.ps1

# Groups functionality
.\test-groups-api.ps1

# Events system
.\test-events-api.ps1

# Complete Phase 5 integration
.\test-group-events-integration.ps1
```

### Manual Testing Examples
```bash
# Health check
curl http://localhost:3000/health

# List events with filters
curl "http://localhost:3000/api/events?category=rally&limit=5"

# Create group
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","description":"Testing"}'
```

---

## 🚀 Production Deployment

### Database Setup
1. **PostgreSQL**: Run `schema.sql` to create all tables and indexes
2. **MongoDB**: Auto-creates collections on first connection
3. **Environment**: Set production environment variables
4. **SSL/TLS**: Configure HTTPS for production

### Performance Considerations
- **Connection pooling**: PostgreSQL (max 20), MongoDB (max 10)
- **Rate limiting**: Tiered limits prevent abuse
- **Indexes**: Optimized for common query patterns
- **Background tasks**: Event reminders run hourly

### Security Checklist
- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled in production
- [ ] Rate limits configured
- [ ] CORS origins restricted
- [ ] Database credentials secured
- [ ] Input validation active

---

## 📈 Development Roadmap

### ✅ **Phase 5 Complete: Advanced Integration**
- Group-event coordination
- Enhanced notifications
- Advanced search and filtering
- Cross-system integration

### 🚧 **Phase 6: Production Features** (Next)
- Real-time WebSocket notifications
- File upload system
- Email notifications
- Mobile push notifications
- Advanced analytics dashboard

### 🔮 **Phase 7: Scale & Optimize** (Future)
- Performance monitoring
- Auto-scaling infrastructure
- Machine learning recommendations
- Microservices architecture

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Test** your changes thoroughly
4. **Submit** a pull request with clear description

## 📝 License

This project is part of the iMobilize social activism platform.

---

## 🆘 Support & Troubleshooting

### Common Issues
- **Database connection failed**: Check PostgreSQL/MongoDB are running
- **JWT secret missing**: Add JWT_SECRET to .env file
- **Port in use**: Kill process on port 3000 or change PORT in .env
- **Rate limited**: Wait 15 minutes or check specific endpoint limits

### Quick Health Check
```bash
# Server status
curl http://localhost:3000/health

# Database connections
curl http://localhost:3000/api/test/postgresql
curl http://localhost:3000/api/test/mongodb
```

**For detailed documentation and advanced features, see the complete API documentation in the `/docs` folder.**