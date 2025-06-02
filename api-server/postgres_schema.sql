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

-- Legal documents table (for storing RCW sections and legal content)
CREATE TABLE legal_documents (
    id SERIAL PRIMARY KEY,
    cite VARCHAR(50) UNIQUE NOT NULL,        -- e.g., "RCW 9A.84.010"
    title VARCHAR(500) NOT NULL,             -- Title of the legal section
    content TEXT NOT NULL,                   -- Full legal text
    penalty VARCHAR(200),                    -- Penalty description
    summary TEXT,                            -- AI-generated summary for protesters
    source_url VARCHAR(1000),                -- URL to official source
    jurisdiction VARCHAR(100) DEFAULT 'Washington State',
    category VARCHAR(50) DEFAULT 'protest-related',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal data updates tracking (for monitoring update processes)
CREATE TABLE legal_data_updates (
    id SERIAL PRIMARY KEY,
    update_type VARCHAR(100) NOT NULL,       -- 'rcw_content', 'bills', 'citations'
    status VARCHAR(50) NOT NULL,             -- 'success', 'error', 'partial'
    details JSONB,                           -- Store error details, counts, etc.
    records_updated INTEGER DEFAULT 0,       -- Number of records updated
    errors_encountered INTEGER DEFAULT 0,    -- Number of errors
    duration_ms INTEGER,                     -- How long the update took
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal citations table (for storing available RCW citations from API)
CREATE TABLE legal_citations (
    id SERIAL PRIMARY KEY,
    cite VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500),
    short_title VARCHAR(200),
    is_protest_related BOOLEAN DEFAULT FALSE,
    api_source VARCHAR(100) DEFAULT 'lawdoccitelookup.leg.wa.gov',
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User legal bookmarks (users can save legal sections for reference)
CREATE TABLE user_legal_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    legal_document_id INTEGER REFERENCES legal_documents(id) NOT NULL,
    notes TEXT,                              -- User's personal notes
    bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, legal_document_id)
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

-- Legal data indexes
CREATE INDEX idx_legal_documents_cite ON legal_documents(cite);
CREATE INDEX idx_legal_documents_category ON legal_documents(category);
CREATE INDEX idx_legal_documents_updated ON legal_documents(last_updated);
CREATE INDEX idx_legal_documents_jurisdiction ON legal_documents(jurisdiction);

CREATE INDEX idx_legal_updates_type ON legal_data_updates(update_type);
CREATE INDEX idx_legal_updates_status ON legal_data_updates(status);
CREATE INDEX idx_legal_updates_time ON legal_data_updates(last_updated);

CREATE INDEX idx_legal_citations_cite ON legal_citations(cite);
CREATE INDEX idx_legal_citations_protest ON legal_citations(is_protest_related);
CREATE INDEX idx_legal_citations_fetched ON legal_citations(fetched_at);

CREATE INDEX idx_user_bookmarks_user ON user_legal_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_document ON user_legal_bookmarks(legal_document_id);

-- Add these comments to your existing comments section:
COMMENT ON TABLE legal_documents IS 'Legal documents and laws relevant to activism and protests';
COMMENT ON TABLE legal_data_updates IS 'Tracking table for legal data update processes and status';
COMMENT ON TABLE legal_citations IS 'Available legal citations from official APIs';
COMMENT ON TABLE user_legal_bookmarks IS 'User-saved legal documents for quick reference';

COMMENT ON COLUMN legal_documents.cite IS 'Official citation (e.g., RCW 9A.84.010)';
COMMENT ON COLUMN legal_documents.penalty IS 'Associated penalty (misdemeanor, felony, etc.)';
COMMENT ON COLUMN legal_documents.summary IS 'Protest-focused summary of the law';
COMMENT ON COLUMN legal_data_updates.details IS 'JSON details about the update process';

-- Insert initial fallback data for immediate testing
INSERT INTO legal_documents (cite, title, content, penalty, summary, source_url, category) VALUES
(
    'RCW 9A.84.010',
    'Riot',
    '(1) A person is guilty of the crime of riot if, acting with four or more other persons, he or she knowingly and unlawfully uses or threatens to use force, or in any way participates in the use of such force, against any other person or against property. (2)(a) Except as provided in (b) of this subsection, the crime of riot is a gross misdemeanor. (b) The crime of riot is a class C felony if the actor is armed with a deadly weapon.',
    'Gross misdemeanor (Class C felony if armed)',
    'Defines riot as coordinated unlawful force by 5+ people. Can be a gross misdemeanor or Class C felony if armed. Important to understand group dynamics in protests.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=9A.84.010',
    'protest-related'
),
(
    'RCW 9A.84.020',
    'Failure to disperse',
    'A person is guilty of failure to disperse if he or she congregates with a group of four or more other persons and in connection with and as a part of the group refuses or fails to disperse when ordered to do so by a peace officer.',
    'Misdemeanor',
    'Requires dispersal when ordered by police if in groups of 5+. Know your rights but understand legal obligations when police issue lawful dispersal orders.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=9A.84.020',
    'protest-related'
),
(
    'RCW 9A.84.030',
    'Disorderly conduct',
    'A person is guilty of disorderly conduct if the person: (a) Uses abusive language and thereby intentionally creates a risk of assault; (b) Intentionally disrupts any lawful assembly or meeting of persons without lawful authority; (c) Intentionally obstructs vehicular or pedestrian traffic without lawful authority.',
    'Misdemeanor',
    'Disorderly conduct can apply to protests. Avoid abusive language, disrupting lawful assemblies, or obstructing traffic without permits.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=9A.84.030',
    'protest-related'
),
(
    'RCW 46.61.250',
    'Pedestrians on roadways',
    'No pedestrian shall unnecessarily stop or delay traffic while upon the part of a highway intended for vehicular traffic.',
    'Traffic infraction',
    'Blocking traffic can result in citations. Plan protest routes on sidewalks or obtain proper permits for street demonstrations.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=46.61.250',
    'protest-related'
),
(
    'RCW 9A.52.070',
    'Criminal trespass in the first degree',
    'A person is guilty of criminal trespass in the first degree if he or she knowingly enters or remains unlawfully in a building.',
    'Gross misdemeanor',
    'Trespassing laws apply to protests on private property. Know property boundaries and obtain permission when necessary.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=9A.52.070',
    'protest-related'
)
ON CONFLICT (cite) DO NOTHING;

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