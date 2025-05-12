-- Create PostgreSQL database
CREATE DATABASE imobilize;

-- Connect to database
\c imobilize

-- Locations table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  address TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL, 
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image_url VARCHAR(255),
  display_name VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user',
  privacy_level VARCHAR(20) DEFAULT 'standard',
  terms_accepted BOOLEAN DEFAULT FALSE,
  data_deletion_requested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location_id INTEGER REFERENCES locations(id),
  location_description TEXT,
  organizer_id INTEGER REFERENCES users(id) NOT NULL,
  organizer_visibility VARCHAR(20) DEFAULT 'username_only',
  cover_image_url VARCHAR(255),
  is_private BOOLEAN DEFAULT FALSE,
  access_code VARCHAR(20),
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event participants table
CREATE TABLE event_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  role VARCHAR(20) DEFAULT 'attendee',
  status VARCHAR(20) DEFAULT 'confirmed',
  visibility VARCHAR(20) DEFAULT 'event_only',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Groups table
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  creator_id INTEGER REFERENCES users(id) NOT NULL,
  cover_image_url VARCHAR(255),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members table
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Resources table
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  resource_url VARCHAR(255),
  author_id INTEGER REFERENCES users(id),
  location_id INTEGER REFERENCES locations(id),
  region_relevance TEXT,
  category VARCHAR(50) NOT NULL,
  tags VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal guides table
CREATE TABLE legal_guides (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  jurisdiction VARCHAR(100),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  source_url VARCHAR(255),
  category VARCHAR(50)
);

-- Forums table
CREATE TABLE forums (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  moderator_id INTEGER REFERENCES users(id),
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum posts table
CREATE TABLE forum_posts (
  id SERIAL PRIMARY KEY,
  forum_id INTEGER REFERENCES forums(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE
);

-- Post comments table
CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES forum_posts(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES post_comments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User saves table
CREATE TABLE user_saves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  content_id INTEGER NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Encrypted messages table
CREATE TABLE encrypted_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) NOT NULL,
  recipient_id INTEGER REFERENCES users(id),
  group_id INTEGER REFERENCES groups(id),
  encrypted_content TEXT NOT NULL,
  public_key_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP
);

-- Privacy consents table
CREATE TABLE privacy_consents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  consent_type VARCHAR(50) NOT NULL,
  is_granted BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP
);