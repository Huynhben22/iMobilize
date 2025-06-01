-- Add these tables to your existing PostgreSQL schema
-- Run this after your main schema is set up

-- Legal documents table (for storing RCW sections and legal content)
CREATE TABLE IF NOT EXISTS legal_documents (
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
CREATE TABLE IF NOT EXISTS legal_data_updates (
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
CREATE TABLE IF NOT EXISTS legal_citations (
    id SERIAL PRIMARY KEY,
    cite VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500),
    short_title VARCHAR(200),
    is_protest_related BOOLEAN DEFAULT FALSE,
    api_source VARCHAR(100) DEFAULT 'lawdoccitelookup.leg.wa.gov',
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User legal bookmarks (users can save legal sections for reference)
CREATE TABLE IF NOT EXISTS user_legal_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    legal_document_id INTEGER REFERENCES legal_documents(id) NOT NULL,
    notes TEXT,                              -- User's personal notes
    bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, legal_document_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_legal_documents_cite ON legal_documents(cite);
CREATE INDEX IF NOT EXISTS idx_legal_documents_category ON legal_documents(category);
CREATE INDEX IF NOT EXISTS idx_legal_documents_updated ON legal_documents(last_updated);
CREATE INDEX IF NOT EXISTS idx_legal_updates_type ON legal_data_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_legal_updates_time ON legal_data_updates(last_updated);
CREATE INDEX IF NOT EXISTS idx_legal_citations_protest ON legal_citations(is_protest_related);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON user_legal_bookmarks(user_id);

-- Insert some initial fallback data for testing
INSERT INTO legal_documents (cite, title, content, penalty, summary, source_url) VALUES
(
    'RCW 9A.84.010',
    'Riot',
    'A person is guilty of riot if, acting with four or more other persons, he or she knowingly and unlawfully uses or threatens to use force, or in any way participates in the use of such force, against any other person or against property.',
    'Class C felony',
    'Defines riot as coordinated unlawful force by 5+ people. Important for protesters to understand group dynamics and legal boundaries.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=9A.84.010'
),
(
    'RCW 9A.84.020',
    'Failure to disperse',
    'A person is guilty of failure to disperse if he or she congregates with a group of four or more other persons and in connection with and as a part of the group refuses or fails to disperse when ordered to do so by a peace officer.',
    'Misdemeanor',
    'Requires dispersal when ordered by police if in groups of 5+. Know your rights but understand legal obligations when police issue lawful dispersal orders.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=9A.84.020'
),
(
    'RCW 46.61.250',
    'Pedestrians on roadways',
    'No pedestrian shall unnecessarily stop or delay traffic while upon the part of a highway intended for vehicular traffic.',
    'Traffic infraction',
    'Blocking traffic can result in citations. Plan protest routes on sidewalks or obtain proper permits for street demonstrations.',
    'https://app.leg.wa.gov/RCW/default.aspx?cite=46.61.250'
)
ON CONFLICT (cite) DO NOTHING;