# iMobilize API Server

> **A comprehensive RESTful API for social activism coordination**  
> Built with Node.js, Express.js, PostgreSQL, and MongoDB

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](/)
[![Version](https://img.shields.io/badge/Version-1.5.0-blue)](/)
[![Phase](https://img.shields.io/badge/Phase-5%20Complete-orange)](/)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+ and npm v10+
- PostgreSQL 17+ (port 5432)
- MongoDB 8.0+ (port 27017)

### Installation
```bash
# 1. Clone and navigate
cd iMobilize/api-server

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Initialize database
psql -U postgres -c "CREATE DATABASE imobilize;"
psql -U postgres -d imobilize -f schema.sql

# 5. Start server
npm run dev
```

### Verify Setup
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/test
```

---

## 📋 API Endpoints Overview

| **Category** | **Endpoints** | **Features** |
|-------------|---------------|--------------|
| **🔐 Authentication** | `/api/auth/*` | JWT-based login, registration, profile management |
| **👥 Groups** | `/api/groups/*` | Create, join, manage activist groups with roles |
| **📅 Events** | `/api/events/*` | Event coordination with group integration |
| **💬 Community** | `/api/community/*` | Forums, posts, nested comments |
| **🔔 Notifications** | `/api/notifications/*` | Real-time alerts and reminders |
| **⚖️ Legal** | `/api/legal/*` | Jurisdiction-specific legal resources |

---

## 🔧 Configuration

### Environment Variables
```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=imobilize

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=imobilize

# Security
JWT_SECRET=your-super-secure-32-character-secret
JWT_EXPIRES_IN=24h

# CORS (for mobile apps)
CORS_ORIGIN=http://localhost:19006,http://localhost:3001
```

---

## 📱 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | User registration | ❌ |
| `POST` | `/api/auth/login` | User login | ❌ |
| `GET` | `/api/auth/verify` | Token verification | ✅ |
| `PUT` | `/api/auth/profile` | Update profile | ✅ |
| `POST` | `/api/auth/logout` | User logout | ✅ |

#### Example: User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "activist123",
    "email": "user@example.com",
    "password": "SecurePass123!",
    "display_name": "Jane Activist",
    "terms_accepted": "true"
  }'
```

### Groups Management

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/api/groups` | List groups | Search, pagination, privacy filters |
| `POST` | `/api/groups` | Create group | Public/private, cover images |
| `GET` | `/api/groups/:id` | Group details | Members, stats, recent activity |
| `POST` | `/api/groups/:id/join` | Join group | Auto-notifications to admins |
| `GET` | `/api/groups/my-groups` | User's groups | Role-based filtering |

#### Example: Create Group
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Climate Action Seattle",
    "description": "Local climate activism group",
    "is_private": false
  }'
```

### Events Coordination

| Method | Endpoint | Description | Enhanced Features |
|--------|----------|-------------|-------------------|
| `GET` | `/api/events` | List events | Group filtering, categories, location search |
| `POST` | `/api/events` | Create event | Group integration, auto-notifications |
| `GET` | `/api/events/:id` | Event details | Participants, group info |
| `POST` | `/api/events/:id/join` | Join event | Access codes for private events |
| `GET` | `/api/events/groups/:groupId/events` | Group events | Group-specific event listing |

#### Advanced Filtering
```bash
# Filter by group and category
GET /api/events?group_id=1&category=rally&my_groups_only=true

# Search by location
GET /api/events?location=downtown&status=upcoming

# Pagination
GET /api/events?limit=20&offset=40
```

#### Event Categories
- `rally` - Public demonstrations
- `meeting` - Group meetings
- `training` - Educational sessions
- `action` - Direct action events
- `fundraiser` - Fundraising events
- `social` - Community building

### Notifications System

| Method | Endpoint | Description | Types |
|--------|----------|-------------|-------|
| `GET` | `/api/notifications` | Get notifications | Filter by type, read status |
| `PUT` | `/api/notifications/:id/read` | Mark as read | Individual notification |
| `PUT` | `/api/notifications/read-all` | Mark all read | Bulk operation |
| `DELETE` | `/api/notifications/:id` | Delete notification | User cleanup |

#### Notification Types
- `event_created` - New group events
- `group_joined` - New member alerts
- `forum_post` - Community activity
- `event_reminder` - 24-hour event reminders

---

## 🎯 Key Features

### 🔐 **Security & Authentication**
- JWT tokens with 24-hour expiration
- bcrypt password hashing (12 salt rounds)
- Rate limiting (100 requests/15 minutes)
- Input validation and SQL injection prevention
- Role-based access control (admin, moderator, member)

### 👥 **Group Management**
- **Hierarchical Roles**: Admin → Moderator → Member
- **Privacy Controls**: Public discovery vs private groups
- **Smart Notifications**: Auto-notify admins of new members
- **Member Management**: Promote, demote, remove members
- **Group Events**: Seamless event organization

### 📅 **Advanced Event System**
- **Group Integration**: Events can be organized by groups
- **Smart Filtering**: By group membership, category, location
- **Privacy Levels**: Public, private, group-members-only
- **Automatic Notifications**: Alert group members of new events
- **Categories**: Rally, meeting, training, action, fundraiser, social

### 🔔 **Intelligent Notifications**
- **Real-time Alerts**: Group activities and event updates
- **Smart Filtering**: Type, read status, expiration
- **Event Reminders**: Automatic 24-hour advance notices
- **Group Context**: Notifications tied to group membership

---

## 📱 Frontend Integration

### Quick Integration Guide

#### 1. **API Service Setup**
```javascript
// services/api.js
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
  }

  async login(credentials) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  }

  async getEvents(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/events?${params}`);
    return response.json();
  }
}
```

#### 2. **Authentication Context**
```javascript
// context/AuthContext.js
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};
```

#### 3. **Screen-to-API Mapping**
| Mobile Screen | Primary Endpoints | Features |
|---------------|-------------------|----------|
| **HomeScreen** | `/api/events`, `/api/notifications` | Event feed, alerts |
| **GroupsScreen** | `/api/groups`, `/api/groups/my-groups` | Group discovery, management |
| **EventsScreen** | `/api/events`, `/api/events/groups/:id/events` | Event creation, filtering |
| **CommunityScreen** | `/api/community/forums` | Discussion forums |
| **ProfileScreen** | `/api/auth/profile` | User settings |

### Required Dependencies
```json
{
  "@react-native-async-storage/async-storage": "^1.19.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/stack": "^6.3.0",
  "@react-navigation/bottom-tabs": "^6.5.0"
}
```

---

## 🧪 Testing

### Health Checks
```bash
# Server status
curl http://localhost:3000/health

# Database connections
curl http://localhost:3000/api/test/postgresql
curl http://localhost:3000/api/test/mongodb
```

### API Testing Scripts
```bash
# Authentication flow
./test-auth-api.ps1

# Groups functionality
./test-groups-api.ps1

# Events with group integration
./test-group-events-integration.ps1
```

### Manual Testing Examples
```bash
# Create user and get token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"TestPass123!","terms_accepted":"true"}'

# Create group with token
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","description":"Testing API"}'

# List events with filters
curl "http://localhost:3000/api/events?category=rally&limit=5"
```

---

## 🚀 Production Deployment

### Database Setup
1. **PostgreSQL**: Execute `schema.sql` for complete table structure
2. **MongoDB**: Collections auto-created on first connection
3. **Indexes**: Optimized for common query patterns
4. **SSL/TLS**: Configure HTTPS for production

### Performance Optimization
- **Connection Pooling**: PostgreSQL (20 max), MongoDB (10 max)
- **Rate Limiting**: Tiered protection against abuse
- **Background Tasks**: Hourly event reminder processing
- **Caching**: Query optimization with proper indexing

### Security Checklist
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Configure CORS origins for mobile apps
- [ ] Set up environment variables securely
- [ ] Enable database SSL connections
- [ ] Configure rate limiting per environment

---

## 📊 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │  Admin Panel    │
│  (React Native) │    │    (React)      │    │    (React)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     iMobilize API         │
                    │   (Node.js + Express)     │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │                           │
          ┌─────────┴─────────┐    ┌─────────────┴─────────────┐
          │   PostgreSQL      │    │       MongoDB             │
          │ (Users, Groups,   │    │  (Messages, Logs,        │
          │  Events, Forums)  │    │   Documents, Analytics)  │
          └───────────────────┘    └───────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Common Issues

| **Issue** | **Cause** | **Solution** |
|-----------|-----------|--------------|
| `Database connection failed` | PostgreSQL/MongoDB not running | Start database services |
| `JWT secret missing` | Missing environment variable | Add `JWT_SECRET` to `.env` |
| `Port 3000 in use` | Another process using port | Change `PORT` in `.env` or kill process |
| `Rate limit exceeded` | Too many requests | Wait 15 minutes or check limits |
| `CORS errors` | Mobile app not in allowed origins | Add IP to `CORS_ORIGIN` |

### Debug Commands
```bash
# Check running processes
lsof -i :3000

# Test database connections
npm run test:db

# View API logs
npm run dev -- --verbose

# Test specific endpoint
curl -v http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📈 Development Roadmap

### ✅ **Phase 5 Complete**
- Group-event integration
- Enhanced notification system
- Advanced search and filtering
- Cross-system data relationships

### 🚧 **Phase 6: Production Features**
- Real-time WebSocket notifications
- File upload and media management
- Email notification system
- Mobile push notifications
- Analytics dashboard

### 🔮 **Phase 7: Scale & Optimize**
- Performance monitoring and metrics
- Auto-scaling infrastructure
- Machine learning recommendations
- Microservices architecture

---

## 📞 Support

### Getting Help
- **Documentation**: Complete API docs in `/docs` folder
- **Issues**: Report bugs via GitHub issues
- **Community**: Join our developer Discord
- **Email**: api-support@imobilize.org

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Write tests for your changes
4. Submit pull request with clear description

---

**🎉 Ready to build the future of social activism? Your API is production-ready!**

[![Deploy](https://img.shields.io/badge/Deploy-Now-brightgreen)](/)
[![Docs](https://img.shields.io/badge/Full%20Docs-Available-blue)](/)
[![License](https://img.shields.io/badge/License-MIT-orange)](/)