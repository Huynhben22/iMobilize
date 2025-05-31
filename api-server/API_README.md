# iMobilize API Server

> **Production-ready RESTful API for social activism coordination**  
> Built with Node.js, Express.js, PostgreSQL, and MongoDB

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
psql -U postgres -d imobilize -f postgres_schema.sql

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

| **Category** | **Endpoints** | **Status** | **Features** |
|-------------|---------------|------------|--------------|
| **🔐 Authentication** | `/api/auth/*` | ✅ **Production Ready** | JWT-based login, registration, profile management |
| **👥 Groups** | `/api/groups/*` | ✅ **Production Ready** | Create, join, manage activist groups with hierarchical roles |
| **📅 Events** | `/api/events/*` | ✅ **Production Ready** | Event coordination with group integration & advanced filtering |
| **💬 Community** | `/api/community/*` | ✅ **Production Ready** | Forums, posts, nested comments |
| **🔔 Notifications** | `/api/notifications/*` | ✅ **Production Ready** | Real-time alerts and reminders |
| **⚖️ Legal** | `/api/legal/*` | ✅ **Production Ready** | Jurisdiction-specific legal resources |

---

## 🎯 Phase 5 Features (Advanced Integration)

### **🎪 Group-Event Coordination**
Your API now provides sophisticated group-based event organization:

```bash
# Create group event with auto-notifications
POST /api/events
{
  "title": "Climate Action Rally",
  "organizing_group_id": 1,
  "category": "rally",
  "group_members_only": false
}

# Get events from user's groups only
GET /api/events?my_groups_only=true

# Get all events for a specific group
GET /api/events/groups/1/events
```

### **🔍 Advanced Search & Filtering**
```bash
# Complex filtering combinations
GET /api/events?category=rally&group_id=1&location=downtown

# Search groups by name/description
GET /api/groups?search=climate&limit=10

# Filter notifications by type
GET /api/notifications?type=event_created&unread_only=true
```

### **👥 Hierarchical Group Management**
```bash
# Groups with role-based permissions
GET /api/groups/my-groups              # User's groups with roles
POST /api/groups/1/join                # Join group (auto-notifies admins)
PUT /api/groups/1/members/5            # Promote member (admin only)
```

### **🔔 Intelligent Notifications**
```bash
# Smart notification system
GET /api/notifications                 # Get personalized alerts
PUT /api/notifications/read-all        # Bulk mark as read
# Auto-generated for: group joins, events, reminders
```

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

### Authentication System

| Method | Endpoint | Description | Tested | Features |
|--------|----------|-------------|--------|----------|
| `POST` | `/api/auth/register` | User registration | ✅ | Email validation, password strength, terms acceptance |
| `POST` | `/api/auth/login` | User login | ✅ | JWT tokens, secure session management |
| `GET` | `/api/auth/verify` | Token verification | ✅ | Auto-validation, user context |
| `PUT` | `/api/auth/profile` | Update profile | ✅ | Privacy controls, bio updates |

### Groups Management

| Method | Endpoint | Description | Tested | Features |
|--------|----------|-------------|--------|----------|
| `GET` | `/api/groups` | List groups | ✅ | Search, pagination, privacy filters |
| `POST` | `/api/groups` | Create group | ✅ | Auto-admin assignment, notifications |
| `GET` | `/api/groups/:id` | Group details | ✅ | Members, stats, recent activity |
| `POST` | `/api/groups/:id/join` | Join group | ✅ | Auto-notifications to admins |
| `GET` | `/api/groups/my-groups` | User's groups | ✅ | Role-based filtering, membership dates |
| `PUT` | `/api/groups/:id/members/:userId` | Update member role | ✅ | Admin/moderator permissions |

### Events Coordination

| Method | Endpoint | Description | Tested | Features |
|--------|----------|-------------|--------|----------|
| `GET` | `/api/events` | List events | ✅ | Group filtering, categories, location search |
| `POST` | `/api/events` | Create event | ✅ | Group integration, auto-notifications |
| `GET` | `/api/events/:id` | Event details | ✅ | Participants, group info, access controls |
| `POST` | `/api/events/:id/join` | Join event | ✅ | Access codes, group member validation |
| `GET` | `/api/events/groups/:groupId/events` | Group events | ✅ | Group-specific event listing |
| `PUT` | `/api/events/:id/group` | Update event group | ✅ | Assign/remove group organization |

### Advanced Filtering Examples
```bash
# Events by group and category
GET /api/events?group_id=1&category=rally&my_groups_only=true

# Search groups by topic
GET /api/groups?search=climate&limit=10

# Location-based event search
GET /api/events?location=downtown&status=upcoming

# User's group activities
GET /api/events?my_groups_only=true&limit=20
```

### Event Categories
- `rally` - Public demonstrations and marches
- `meeting` - Group meetings and planning sessions
- `training` - Educational workshops and skill-building
- `action` - Direct action events and campaigns
- `fundraiser` - Fundraising events and activities
- `social` - Community building and networking
- `other` - General events and activities

### Notifications System

| Method | Endpoint | Description | Tested | Types |
|--------|----------|-------------|--------|--------|
| `GET` | `/api/notifications` | Get notifications | ✅ | Filter by type, read status, expiration |
| `PUT` | `/api/notifications/:id/read` | Mark as read | ✅ | Individual notification management |
| `PUT` | `/api/notifications/read-all` | Mark all read | ✅ | Bulk operations |
| `DELETE` | `/api/notifications/:id` | Delete notification | ✅ | User cleanup and management |

#### Notification Types
- `event_created` - New group events
- `group_joined` - New member alerts for admins
- `forum_post` - Community activity updates
- `event_reminder` - 24-hour advance event reminders

---

## 🧪 Testing

### Comprehensive Test Suite
Your API includes PowerShell test scripts that validate all functionality:

```powershell
# Run complete test suite
cd api-server/tests
.\test-complete-api.ps1

# Individual system tests
.\test-auth-api.ps1              # Authentication system
.\test-groups-api.ps1            # Groups management  
.\test-group-events-integration.ps1  # Phase 5 integration
```

### Test Results Status
| Test Suite | Status | Coverage |
|------------|--------|----------|
| **Authentication** | ✅ **PASSED** | Registration, login, tokens, validation |
| **Groups Management** | ✅ **PASSED** | Creation, joining, roles, permissions |
| **Group-Event Integration** | ✅ **PASSED** | Coordination, filtering, notifications |
| **Advanced Features** | ✅ **PASSED** | Search, categories, cross-system queries |

### Manual Testing Examples
```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3000/api/test/postgresql
curl http://localhost:3000/api/test/mongodb

# Create user and test workflow
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"TestPass123!","terms_accepted":"true"}'

# Create group with token
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","description":"Testing API"}'
```

---

## 🏆 Key Features

### 🔐 **Security & Authentication**
- **JWT tokens** with 24-hour expiration
- **bcrypt password hashing** (12 salt rounds)
- **Rate limiting** (100 requests/15 minutes)
- **Input validation** and SQL injection prevention
- **Role-based access control** (admin, moderator, member)

### 👥 **Advanced Group Management**
- **Hierarchical Roles**: Admin → Moderator → Member permissions
- **Smart Notifications**: Auto-notify admins of new members
- **Privacy Controls**: Public discovery vs private groups
- **Member Management**: Promote, demote, remove members with proper authorization
- **Group Search**: Find groups by name, description, and topics

### 📅 **Sophisticated Event System**
- **Group Integration**: Events can be organized by groups with automatic member notifications
- **Smart Filtering**: By group membership, category, location, and custom combinations
- **Privacy Levels**: Public, private, group-members-only with access code support
- **Event Categories**: Rally, meeting, training, action, fundraiser, social, other
- **Participation Management**: Join/leave with role-based permissions

### 🔔 **Intelligent Notifications**
- **Real-time Alerts**: Group activities, new events, member joins
- **Smart Filtering**: By type, read status, expiration date
- **Auto-Reminders**: 24-hour advance event notifications
- **Group Context**: Notifications tied to group membership and activities

### 🔍 **Advanced Search & Discovery**
- **Cross-System Filtering**: Events by groups, categories, locations
- **"My Groups" Logic**: Show only events from user's groups
- **Combined Queries**: Multiple filter combinations for precise results
- **Pagination Support**: Efficient handling of large datasets

---

## 📱 Frontend Integration Guide

### Quick Integration Pattern
```javascript
// services/api.js - Production-ready API service
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
  }

  // Group-event integration example
  async getMyGroupEvents() {
    return this.request('/events?my_groups_only=true');
  }

  async createGroupEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getGroupMembers(groupId) {
    return this.request(`/groups/${groupId}/members`);
  }
}
```

### Screen-to-API Mapping
| Mobile Screen | Primary Endpoints | Advanced Features |
|---------------|-------------------|-------------------|
| **HomeScreen** | `/api/events`, `/api/notifications` | Group event feed, smart alerts |
| **GroupsScreen** | `/api/groups`, `/api/groups/my-groups` | Search, join, role management |
| **EventsScreen** | `/api/events`, `/api/events/groups/:id/events` | Categories, group filtering |
| **CommunityScreen** | `/api/community/forums` | Group forums, discussions |
| **ProfileScreen** | `/api/auth/profile` | Privacy settings, group memberships |

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

## 🚀 Production Deployment

### Performance & Security
- **Connection Pooling**: PostgreSQL (20 max), MongoDB (10 max)
- **Rate Limiting**: Tiered protection against abuse
- **Background Tasks**: Hourly event reminder processing
- **Query Optimization**: Proper indexing for common patterns
- **CORS Configuration**: Secure origin management

### Security Checklist
- [x] Strong JWT secret (32+ characters)
- [x] Rate limiting configured for all endpoints
- [x] Input validation on all user inputs
- [x] SQL injection prevention
- [x] Password strength requirements
- [x] Role-based permission controls
- [x] Privacy settings respected
- [x] Error handling without information leakage

### Database Setup
1. **PostgreSQL**: Execute `postgres_schema.sql` for complete structure
2. **MongoDB**: Collections auto-created with proper indexing
3. **Indexes**: Optimized for group-event queries and filtering
4. **SSL/TLS**: Configure HTTPS for production deployment

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
                    │                           │
                    │  ✅ Authentication        │
                    │  ✅ Groups Management     │
                    │  ✅ Events Coordination   │
                    │  ✅ Community Forums      │
                    │  ✅ Notifications         │
                    │  ✅ Advanced Integration  │
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

### Common Issues & Solutions

| **Issue** | **Cause** | **Solution** |
|-----------|-----------|--------------|
| `Database connection failed` | PostgreSQL/MongoDB not running | Start database services |
| `JWT secret missing` | Missing environment variable | Add `JWT_SECRET` to `.env` |
| `Rate limit exceeded` | Too many requests | Wait 15 minutes or adjust limits |
| `CORS errors` | Mobile app not in allowed origins | Add device IP to `CORS_ORIGIN` |
| `Permission denied` | Role-based access issue | Check user roles and group membership |

### Debug Commands
```bash
# Check server status
curl -v http://localhost:3000/health

# Test database connections
curl http://localhost:3000/api/test/postgresql
curl http://localhost:3000/api/test/mongodb

# Verify authentication
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test group membership
curl http://localhost:3000/api/groups/my-groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📞 Support & Contributing

### Getting Help
- **Complete Documentation**: All endpoints documented with examples
- **Test Suite**: Comprehensive PowerShell tests for validation
- **Architecture Guide**: Clear system overview and integration patterns
- **Troubleshooting**: Common issues and solutions provided

### Contributing Guidelines
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run test suite (`.\test-complete-api.ps1`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Submit pull request with clear description

### Quality Standards
- All new features must include tests
- API endpoints require proper documentation
- Security considerations for all user inputs
- Performance optimization for database queries

---

## 🎉 Production Ready

**Your iMobilize API is now production-ready with advanced group-event integration!**

### ✅ **Verified Capabilities:**
- **Complete Authentication System** with secure JWT management
- **Advanced Group Management** with hierarchical roles and permissions
- **Sophisticated Event Coordination** with group integration and smart filtering
- **Intelligent Notification System** with auto-reminders and group context
- **Comprehensive Testing** with validated functionality across all systems
- **Production Security** with rate limiting, input validation, and access controls

### 🚀 **Ready for Frontend Integration:**
- Well-documented API with clear examples
- Consistent response formats for easy parsing
- Advanced filtering for optimal user experiences
- Role-based permissions for secure interactions
- Mobile-optimized endpoints for React Native apps

📋 Frontend Integration Phases
🎯 Phase 6: Authentication Integration (COMPLETED ✅)
What we accomplished:

✅ Fixed file structure issues - Created missing src/context/ and src/services/ directories
✅ Resolved import path errors - Fixed export/import statements across components
✅ Set up AuthContext - Global authentication state management
✅ Integrated API Service - Full communication with backend API
✅ Built complete auth flow - Welcome → Register/Login → Terms → Dashboard
✅ Fixed CORS issues - API server configured for localhost:8081
✅ Added persistent sessions - JWT token management with AsyncStorage
✅ Connected real HomeScreen - Replaced placeholder with actual UI
✅ Production cleanup - Removed debug messages and optimized code

Key files created/updated:

src/context/AuthContext.js
src/services/api.js
src/screens/main/WelcomeScreen.js
src/screens/main/AuthScreen.js
src/navigation/AppNavigator.js
src/navigation/MainNavigator.js
App.js

🚧 Phase 7: Enhanced Integration (NEXT)
Planned for next session:

Real API Data Integration - Replace HomeScreen mock data with live events from /api/events
Complete Tab Navigation - Integrate all screens (Community, Organizer, Resources, Profile)
Logout Functionality - User session management and proper logout flow
Live Notifications - Connect to /api/notifications endpoint
Additional Screens - CommunityScreen, OrganizerScreen, ResourcesScreen, ProfileScreen

🔮 Phase 8: Advanced Features (FUTURE)

Real-time Updates - WebSocket notifications
File Upload - Profile images and document management
Offline Support - Cached data for better UX
Push Notifications - Mobile notifications
Performance Optimization - Loading states, error boundaries