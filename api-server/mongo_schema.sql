// Collection: educational_resources
// Purpose: Stores educational content like articles, videos, guides, etc.
{
  _id: ObjectId,                 // Automatically generated unique identifier
  title: String,                 // Title of the resource (required)
  description: String,           // Brief description of the resource (required)
  content_type: String,          // Type of content: "article", "video", "pdf", etc. (required)
  content: String,               // Main content text for articles
  media_url: String,             // URL for videos, PDFs, or other media
  attachments: [                 // Array of files attached to the resource
    {
      name: String,              // Name of the attachment
      file_url: String,          // URL to download the attachment
      file_type: String          // Type of the file: "pdf", "docx", etc.
    }
  ],
  author_id: Number,             // References PostgreSQL users.id
  tags: [String],                // Array of tags for categorization
  categories: [String],          // Array of categories for organization
  region_relevance: String,      // Optional text description of relevant regions
  is_verified: Boolean,          // Whether content has been verified
  metadata: {
    created_at: Date,            // Creation timestamp
    updated_at: Date,            // Last update timestamp
    views: Number,               // View count
    saves: Number,               // Number of times saved by users
    shares: Number               // Number of times shared
  },
  related_resources: [ObjectId]  // References to other educational resources
}

// Collection: chat_messages
// Purpose: Stores encrypted messages between users or in groups
{
  _id: ObjectId,                 // Automatically generated unique identifier
  chat_id: String,               // Unique identifier for the conversation
  sender_id: Number,             // References PostgreSQL users.id (required)
  recipient_id: Number,          // User ID of recipient (null if sent to group)
  group_id: Number,              // References PostgreSQL groups.id (null if direct message)
  content: String,               // Message content (required)
  content_type: String,          // Type of content: "text", "image", "file", etc.
  media_url: String,             // URL for any media in the message
  read_status: {
    is_read: Boolean,            // Whether message has been read
    read_at: Date                // When message was read
  },
  sent_at: Date,                 // Timestamp when message was sent (required)
  encrypted_payload: String,     // Encrypted version of the message for E2E encryption
  expires_at: Date               // For disappearing messages
}

// Collection: documents
// Purpose: Stores files and documents with permission controls
{
  _id: ObjectId,                 // Automatically generated unique identifier
  title: String,                 // Document title (required)
  description: String,           // Document description
  document_type: String,         // Type: "evidence", "permit", "legal_document", etc. (required)
  file_url: String,              // URL to access the file (required)
  location_id: Number,           // References PostgreSQL locations.id
  tags: [String],                // Array of tags
  metadata: {
    created_at: Date,            // Creation timestamp
    updated_at: Date,            // Last update timestamp
    author_id: Number,           // References PostgreSQL users.id
    file_size: Number,           // Size in bytes
    file_format: String          // Format: "pdf", "docx", "jpg", etc.
  },
  permissions: {
    public: Boolean,             // Whether document is publicly accessible
    group_id: Number,            // If shared with specific group
    user_ids: [Number]           // If shared with specific users
  },
  events: [Number]               // Related event IDs from PostgreSQL
}

// Collection: activity_logs
// Purpose: Tracks user actions for security and analytics
{
  _id: ObjectId,                 // Automatically generated unique identifier
  user_id: Number,               // References PostgreSQL users.id (required)
  action_type: String,           // Type of action: "login", "post_created", etc. (required)
  resource_type: String,         // Type of resource acted upon: "event", "forum", etc.
  resource_id: Number,           // ID in the corresponding PostgreSQL table
  ip_address: String,            // IP address from which action was performed
  device_info: {
    device_type: String,         // Type of device: "mobile", "desktop", etc.
    operating_system: String,    // OS: "Windows", "iOS", "Android", etc.
    browser: String              // Browser used
  },
  timestamp: Date,               // When the action occurred (required)
  geo_location: {                // Optional, only if user allowed location access
    city: String,                // City name
    country: String              // Country name
  }
}

// Collection: safety_protocols
// Purpose: Stores safety guidelines and emergency protocols
{
  _id: ObjectId,                 // Automatically generated unique identifier
  title: String,                 // Protocol title (required)
  content: String,               // Detailed description/instructions (required)
  protocol_type: String,         // Type: "emergency", "legal", "health", etc. (required)
  jurisdiction: String,          // Relevant legal jurisdiction
  created_by: Number,            // References PostgreSQL users.id
  last_updated: Date,            // When last updated
  tags: [String],                // Array of tags
  steps: [                       // Ordered steps to follow
    {
      order: Number,             // Step number
      title: String,             // Step title
      description: String,       // Step description
      contacts: [                // People to contact for this step
        {
          name: String,          // Contact name
          role: String,          // Role: "legal_aid", "medic", etc.
          phone: String,         // Phone number
          email: String          // Email
        }
      ]
    }
  ]
}