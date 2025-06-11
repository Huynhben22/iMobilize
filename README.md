# iMobilize

A comprehensive mobile/web application aimed at facilitating social/civic activism by providing educational resources, location-specific legal guides, and tools for coordination and communication.

## Project Goals

- Eliminate barriers to social/civic activism
- Provide quality education on activism methods
- Offer location-specific legal guides and resources
- Create tools for group organization and event coordination
- Support SDG goals 16 ("Peace, Justice, and Strong Institutions") and 10 ("Reduced Inequalities")

## Features

- Event organization tools
- Educational resources on activism methods
- Location-specific legal guides
- Forum-like communication system
- Documentation support
- Safety and security protocols

## Tech Stack

- **Frontend**: React Native (mobile)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB and PostgreSQL
- **End-to-End Encryption**: Signal Protocol

## Prerequisites

- Node.js (v20 or higher)
- npm (v10 or higher)
- Expo CLI (for mobile development)
- PostgreSQL 17+ (port 5432)
- MongoDB 8.0+ (port 27017)

## 🚀 Complete Setup Instructions

### 1. Clone and Install Frontend

```bash
# Clone the repository
git clone https://github.com/Huynhben22/iMobilize.git
cd iMobilize/iMobilize-js

# Install dependencies
npm install

# Install web dependencies
npx expo install react-dom react-native-web @expo/metro-runtime
```

### 2. Database Setup

#### PostgreSQL Setup
```bash
# Install PostgreSQL (Windows/Mac)
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# Start PostgreSQL service
# Windows: Use pgAdmin or Services
# Mac: brew services start postgresql

# Create database and user
psql -U postgres -c "CREATE DATABASE imobilize;"
psql -U postgres -c "CREATE USER imobilize_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE imobilize TO imobilize_user;"

# Initialize database schema
psql -U postgres -d imobilize -f postgres_schema.sql
```

#### MongoDB Setup
```bash
# Install MongoDB (Windows/Mac)
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community

# Start MongoDB service
# Windows: Use MongoDB Compass or Services
# Mac: brew services start mongodb-community

# MongoDB will auto-create collections when first used
```

### 3. Backend API Setup

```bash
# Navigate to API server directory
cd ../api-server  # or wherever your server code is located

# Install server dependencies
npm install

# Create environment configuration
cp .env.example .env
```

**Edit `.env` file with your database credentials:**
*Copy this whole bit into a .env file and update the PG password*

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=yourpassword
PG_DATABASE=imobilize
PG_MAX_CONNECTIONS=20

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

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (for future features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=another-super-secure-secret-for-sessions

# CORS Configuration
CORS_ORIGIN=http://localhost:19006,http://localhost:3001
CORS_CREDENTIALS=true

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000
DEBUG_MODE=true
```

**Start the API server:**
```bash
npm start
# or for development with auto-restart:
npm run dev
```

**Test API Server Conncections**
```bash
# Test server health
curl http://localhost:3000/health

# Test database connections
curl http://localhost:3000/api/test/postgresql
curl http://localhost:3000/api/test/mongodb

# Test API endpoints
curl http://localhost:3000/api/test
```

### 5. Start Frontend

```bash
# Go back to frontend directory
cd ../iMobilize-js

# Start the development server
npm start
```