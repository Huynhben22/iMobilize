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

-- Groups table (Phase 4 - Groups Management)
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  creator_id INTEGER REFERENCES users(id) NOT NULL,
  cover_image_url VARCHAR(255),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members table (Phase 4 - Groups Management)
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Enhanced Events table (Phase 5 - Group-Event Integration)
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
  
  -- Phase 5 Enhancements: Group Integration
  organizing_group_id INTEGER REFERENCES groups(id),
  group_members_only BOOLEAN DEFAULT FALSE,
  category VARCHAR(20) DEFAULT 'other',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT events_category_check 
    CHECK (category IN ('rally', 'meeting', 'training', 'action', 'fundraiser', 'social', 'other')),
  CONSTRAINT events_status_check 
    CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  CONSTRAINT events_organizer_visibility_check 
    CHECK (organizer_visibility IN ('username_only', 'full_name', 'anonymous'))
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

-- User saves table
CREATE TABLE user_saves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  content_id INTEGER NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FIXED: Notifications table (Phase 5 - Enhanced Notifications) 
-- This is the corrected version that matches the working implementation
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'event_created', 'event_updated', 'group_event', 'forum_post', 'group_joined', 'event_reminder'
  title VARCHAR(200) NOT NULL, -- FIXED: Added missing title column
  content TEXT NOT NULL,
  related_type VARCHAR(20), -- 'event', 'group', 'forum', 'post'
  related_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- For time-sensitive notifications
  action_url VARCHAR(500) -- Deep link to relevant content
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

-- Create indexes for performance optimization

-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Group indexes
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_creator_id ON groups(creator_id);
CREATE INDEX idx_groups_is_private ON groups(is_private);
CREATE INDEX idx_groups_created_at ON groups(created_at);

-- Group member indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);

-- Event indexes (Phase 5 Enhanced)
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_organizing_group_id ON events(organizing_group_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_is_private ON events(is_private);
CREATE INDEX idx_events_group_members_only ON events(group_members_only);
CREATE INDEX idx_events_start_time_status ON events(start_time, status);
CREATE INDEX idx_events_location_id ON events(location_id);

-- Event participant indexes
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX idx_event_participants_status ON event_participants(status);

-- Forum indexes
CREATE INDEX idx_forums_group_id ON forums(group_id);
CREATE INDEX idx_forums_moderator_id ON forums(moderator_id);
CREATE INDEX idx_forums_created_at ON forums(created_at);

-- Forum post indexes
CREATE INDEX idx_forum_posts_forum_id ON forum_posts(forum_id);
CREATE INDEX idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at);

-- Comment indexes
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_parent_comment_id ON post_comments(parent_comment_id);

-- FIXED: Notification indexes (Phase 5) - Complete set of indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- Resource indexes
CREATE INDEX idx_resources_author_id ON resources(author_id);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_location_id ON resources(location_id);
CREATE INDEX idx_resources_created_at ON resources(created_at);

-- Add comments for documentation
COMMENT ON TABLE groups IS 'Groups for organizing activists and coordinating activities';
COMMENT ON TABLE group_members IS 'Group membership with role-based permissions (member, moderator, admin)';
COMMENT ON TABLE events IS 'Events organized by individuals or groups with enhanced filtering capabilities';
COMMENT ON TABLE notifications IS 'System notifications for group activities, events, and forum posts - FIXED with all required columns';

COMMENT ON COLUMN events.organizing_group_id IS 'ID of the group organizing this event (null for individual events)';
COMMENT ON COLUMN events.group_members_only IS 'Whether this event is restricted to group members only';
COMMENT ON COLUMN events.category IS 'Category of event: rally, meeting, training, action, fundraiser, social, other';

COMMENT ON COLUMN group_members.role IS 'Role in group: member, moderator, admin';
COMMENT ON COLUMN notifications.type IS 'Notification type: event_created, group_joined, forum_post, event_reminder, etc.';
COMMENT ON COLUMN notifications.title IS 'Notification title - FIXED: This column was missing in original schema';
COMMENT ON COLUMN notifications.expires_at IS 'When notification expires (null for permanent notifications)';
COMMENT ON COLUMN notifications.action_url IS 'Deep link URL to relevant content';

-- Create useful views for common queries

-- View for group events with group information
CREATE OR REPLACE VIEW group_events_view AS
SELECT 
    e.*,
    g.name as group_name,
    g.is_private as group_is_private,
    g.description as group_description,
    COUNT(gm.id) as group_member_count
FROM events e
LEFT JOIN groups g ON e.organizing_group_id = g.id
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE e.organizing_group_id IS NOT NULL
GROUP BY e.id, g.id, g.name, g.is_private, g.description;

-- View for user group memberships with statistics
CREATE OR REPLACE VIEW user_groups_view AS
SELECT 
    gm.user_id,
    gm.group_id,
    g.name as group_name,
    g.description as group_description,
    g.is_private,
    gm.role,
    gm.joined_at,
    COUNT(DISTINCT gm2.id) as total_members,
    COUNT(DISTINCT e.id) as group_events_count
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN group_members gm2 ON g.id = gm2.group_id
LEFT JOIN events e ON g.id = e.organizing_group_id
GROUP BY gm.user_id, gm.group_id, g.name, g.description, g.is_private, gm.role, gm.joined_at;

-- View for event participants with user and group information
CREATE OR REPLACE VIEW event_participants_view AS
SELECT 
    ep.*,
    u.username,
    u.display_name,
    e.title as event_title,
    e.organizing_group_id,
    g.name as organizing_group_name
FROM event_participants ep
JOIN users u ON ep.user_id = u.id
JOIN events e ON ep.event_id = e.id
LEFT JOIN groups g ON e.organizing_group_id = g.id;

-- PHASE 5 COMPLETION MARKER
-- Schema version: 1.5.0 - Phase 5 Advanced Integration Complete
-- Last updated: [Current Date]
-- Changes: Fixed notifications table with all required columns and indexes

COMMIT;