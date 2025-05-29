// routes/events.js
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { getPostgreSQLPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for events
const eventsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many event requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

// Stricter rate limiting for creating events
const createEventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 event creations per windowMs
  message: {
    success: false,
    message: 'Too many event creations, please try again later',
    error: 'CREATE_EVENT_RATE_LIMIT_EXCEEDED'
  }
});

// Validation rules - using same pattern as community.js
const eventValidation = [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Event title must be between 3 and 100 characters')
    .trim(),
  
  body('description')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Event description must be between 10 and 5000 characters')
    .trim(),
  
  body('start_time')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('end_time')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_time)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('location_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Location description cannot exceed 500 characters')
    .trim(),
  
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('is_private must be a boolean'),
  
  body('access_code')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Access code must be between 4 and 20 characters')
    .trim()
];

// ===========================================
// PHASE 1: BASIC CRUD ENDPOINTS
// ===========================================

/**
 * GET /api/events
 * List all public events (with pagination)
 */
router.get('/', eventsLimiter, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  
  query('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Status must be upcoming, ongoing, completed, or cancelled')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { limit = 20, offset = 0, status = 'upcoming' } = req.query;
    const pool = getPostgreSQLPool();

    // Simple, clean query - no complex joins
    const result = await pool.query(`
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.location_description, e.status, e.created_at,
        u.username as organizer_username,
        u.display_name as organizer_display_name,
        COUNT(ep.id) as participant_count
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.status = 'confirmed'
      WHERE e.is_private = false AND e.status = $1
      GROUP BY e.id, e.title, e.description, e.start_time, e.end_time,
               e.location_description, e.status, e.created_at,
               u.username, u.display_name
      ORDER BY e.start_time ASC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM events WHERE is_private = false AND status = $1',
      [status]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events',
      error: 'GET_EVENTS_ERROR'
    });
  }
});

/**
 * POST /api/events
 * Create a new event (requires authentication)
 */
router.post('/', verifyToken, createEventLimiter, eventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const {
      title,
      description,
      start_time,
      end_time,
      location_description,
      is_private = false,
      access_code
    } = req.body;
    
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Simple insert - no complex business logic yet
    const result = await pool.query(`
      INSERT INTO events (
        title, description, start_time, end_time, location_description,
        organizer_id, is_private, access_code, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'upcoming', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, description, start_time, end_time, location_description,
                is_private, status, created_at
    `, [
      title, description, start_time, end_time, location_description || null,
      userId, is_private, access_code || null
    ]);

    const newEvent = result.rows[0];

    // Automatically add organizer as participant
    await pool.query(`
      INSERT INTO event_participants (event_id, user_id, role, status, registered_at)
      VALUES ($1, $2, 'organizer', 'confirmed', CURRENT_TIMESTAMP)
    `, [newEvent.id, userId]);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: newEvent
      }
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: 'CREATE_EVENT_ERROR'
    });
  }
});

/**
 * GET /api/events/:id
 * Get a specific event with participants
 */
router.get('/:id', eventsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Event ID must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const eventId = req.params.id;
    const pool = getPostgreSQLPool();

    // Get event details
    const eventResult = await pool.query(`
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.location_description, e.is_private, e.access_code, e.status,
        e.created_at, e.updated_at,
        u.username as organizer_username,
        u.display_name as organizer_display_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND'
      });
    }

    const event = eventResult.rows[0];

    // Check if event is private and user has access
    if (event.is_private) {
      // For now, just return basic info for private events
      // TODO: Implement access code verification
      return res.json({
        success: true,
        message: 'Private event - limited information',
        data: {
          event: {
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            is_private: true
          }
        }
      });
    }

    // Get participants (only for public events for now)
    const participantsResult = await pool.query(`
      SELECT 
        ep.role, ep.status, ep.registered_at,
        u.username, u.display_name
      FROM event_participants ep
      LEFT JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = $1 AND ep.status = 'confirmed'
      ORDER BY ep.registered_at ASC
    `, [eventId]);

    res.json({
      success: true,
      message: 'Event retrieved successfully',
      data: {
        event: event,
        participants: participantsResult.rows
      }
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event',
      error: 'GET_EVENT_ERROR'
    });
  }
});

// ===========================================
// PHASE 2: PARTICIPATION ENDPOINTS
// ===========================================

/**
 * POST /api/events/:id/join
 * Join an event (requires authentication)
 */
router.post('/:id/join', verifyToken, eventsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Event ID must be a positive integer'),
  body('access_code')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Access code must be between 4 and 20 characters')
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const eventId = req.params.id;
    const userId = req.user.id;
    const { access_code } = req.body;
    const pool = getPostgreSQLPool();

    // Check if event exists and get details
    const eventResult = await pool.query(
      'SELECT id, is_private, access_code, status FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND'
      });
    }

    const event = eventResult.rows[0];

    // Check if event is still upcoming
    if (event.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot join event that is not upcoming',
        error: 'EVENT_NOT_UPCOMING'
      });
    }

    // Check access code for private events
    if (event.is_private && event.access_code !== access_code) {
      return res.status(403).json({
        success: false,
        message: 'Invalid access code for private event',
        error: 'INVALID_ACCESS_CODE'
      });
    }

    // Check if user is already a participant
    const existingParticipant = await pool.query(
      'SELECT id FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event',
        error: 'ALREADY_REGISTERED'
      });
    }

    // Add participant
    const result = await pool.query(`
      INSERT INTO event_participants (event_id, user_id, role, status, registered_at)
      VALUES ($1, $2, 'attendee', 'confirmed', CURRENT_TIMESTAMP)
      RETURNING id, role, status, registered_at
    `, [eventId, userId]);

    res.status(201).json({
      success: true,
      message: 'Successfully joined event',
      data: {
        participation: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join event',
      error: 'JOIN_EVENT_ERROR'
    });
  }
});

/**
 * DELETE /api/events/:id/leave
 * Leave an event (requires authentication)
 */
router.delete('/:id/leave', verifyToken, eventsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Event ID must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const eventId = req.params.id;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Check if user is a participant
    const participantResult = await pool.query(
      'SELECT id, role FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered for this event',
        error: 'NOT_REGISTERED'
      });
    }

    // Don't allow organizers to leave their own events
    if (participantResult.rows[0].role === 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'Event organizers cannot leave their own events',
        error: 'ORGANIZER_CANNOT_LEAVE'
      });
    }

    // Remove participant
    await pool.query(
      'DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    res.json({
      success: true,
      message: 'Successfully left event'
    });

  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave event',
      error: 'LEAVE_EVENT_ERROR'
    });
  }
});

module.exports = router;