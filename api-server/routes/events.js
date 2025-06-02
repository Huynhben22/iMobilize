// routes/events.js - ENHANCED VERSION with Group Integration
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { getPostgreSQLPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { createGroupEventNotification } = require('./notifications');

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
// Enhanced validation rules for group events
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
    .trim(),
  
  // NEW: Group integration fields
  body('organizing_group_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Organizing group ID must be a positive integer'),
  
  body('group_members_only')
    .optional()
    .isBoolean()
    .withMessage('group_members_only must be a boolean'),
  
  body('category')
    .optional()
    .isIn(['rally', 'meeting', 'training', 'action', 'fundraiser', 'social', 'other'])
    .withMessage('Category must be one of: rally, meeting, training, action, fundraiser, social, other')
];

/**
 * GET /api/events
 * List events with enhanced group filtering
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
    .withMessage('Status must be upcoming, ongoing, completed, or cancelled'),
  
  // NEW: Group-related filters
  query('group_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer'),
  
  query('my_groups_only')
    .optional()
    .isBoolean()
    .withMessage('my_groups_only must be a boolean'),
  
  query('category')
    .optional()
    .isIn(['rally', 'meeting', 'training', 'action', 'fundraiser', 'social', 'other'])
    .withMessage('Invalid category'),
  
  query('location')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location filter must be between 2 and 100 characters')
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

    const { 
      limit = 20, 
      offset = 0, 
      status = 'upcoming', 
      group_id, 
      my_groups_only, 
      category,
      location 
    } = req.query;
    
    const userId = req.user ? req.user.id : null;
    const pool = getPostgreSQLPool();

    // Build dynamic query
    let baseQuery = `
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.location_description, e.status, e.created_at, e.category,
        e.organizing_group_id, e.group_members_only,
        u.username as organizer_username,
        u.display_name as organizer_display_name,
        g.name as organizing_group_name,
        g.is_private as group_is_private,
        COUNT(ep.id) as participant_count,
        CASE 
          WHEN e.organizing_group_id IS NOT NULL AND gm.user_id IS NOT NULL THEN true
          ELSE false
        END as user_in_organizing_group
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN groups g ON e.organizing_group_id = g.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.status = 'confirmed'
      LEFT JOIN group_members gm ON e.organizing_group_id = gm.group_id AND gm.user_id = $1
    `;

    const conditions = ['e.status = $2'];
    const params = [userId, status];
    let paramCount = 3;

    // Privacy filtering
    if (!userId) {
      conditions.push('(e.is_private = false AND (e.group_members_only = false OR e.group_members_only IS NULL))');
    } else {
      conditions.push(`(
        e.is_private = false OR 
        e.organizer_id = $1 OR
        (e.organizing_group_id IS NOT NULL AND gm.user_id IS NOT NULL)
      )`);
    }

    // Group filtering
    if (group_id) {
      conditions.push(`e.organizing_group_id = $${paramCount}`);
      params.push(group_id);
      paramCount++;
    }

    // My groups only filter
    if (my_groups_only === 'true' && userId) {
      conditions.push('e.organizing_group_id IS NOT NULL AND gm.user_id IS NOT NULL');
    }

    // Category filtering
    if (category) {
      conditions.push(`e.category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    // Location filtering
    if (location) {
      conditions.push(`e.location_description ILIKE $${paramCount}`);
      params.push(`%${location}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    
    const query = baseQuery + whereClause + `
      GROUP BY e.id, e.title, e.description, e.start_time, e.end_time,
               e.location_description, e.status, e.created_at, e.category,
               e.organizing_group_id, e.group_members_only,
               u.username, u.display_name, g.name, g.is_private, gm.user_id
      ORDER BY e.start_time ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count with same filters
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) 
      FROM events e
      LEFT JOIN groups g ON e.organizing_group_id = g.id
      LEFT JOIN group_members gm ON e.organizing_group_id = gm.group_id AND gm.user_id = $1
    `;
    
    countQuery += whereClause;
    const countParams = params.slice(0, -2); // Remove limit and offset
    
    const countResult = await pool.query(countQuery, countParams);
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
        },
        filters_applied: {
          status,
          group_id: group_id || null,
          my_groups_only: my_groups_only === 'true',
          category: category || null,
          location: location || null
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
 * Create a new event with optional group organization
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
      access_code,
      organizing_group_id,
      group_members_only = false,
      category = 'other'
    } = req.body;
    
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // If organizing group is specified, verify user permissions
    if (organizing_group_id) {
      const groupMember = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [organizing_group_id, userId]
      );

      if (groupMember.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of the group to organize events for it',
          error: 'NOT_GROUP_MEMBER'
        });
      }

      // Only admins and moderators can create events for groups
      const userRole = groupMember.rows[0].role;
      if (!['admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only group admins and moderators can organize events',
          error: 'INSUFFICIENT_GROUP_PERMISSIONS'
        });
      }

      // For group events, inherit some privacy settings
      if (group_members_only) {
        // If it's group members only, check if group is private
        const groupInfo = await pool.query(
          'SELECT is_private FROM groups WHERE id = $1',
          [organizing_group_id]
        );
        
        if (groupInfo.rows[0].is_private) {
          is_private = true; // Force private for private group events
        }
      }
    }

    // Create event with group integration
    const result = await pool.query(`
      INSERT INTO events (
        title, description, start_time, end_time, location_description,
        organizer_id, is_private, access_code, organizing_group_id, 
        group_members_only, category, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'upcoming', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, description, start_time, end_time, location_description,
                is_private, organizing_group_id, group_members_only, category, status, created_at
    `, [
      title, description, start_time, end_time, location_description || null,
      userId, is_private, access_code || null, organizing_group_id || null,
      group_members_only, category
    ]);

    const newEvent = result.rows[0];

    // Add organizer as participant
    await pool.query(`
      INSERT INTO event_participants (event_id, user_id, role, status, registered_at)
      VALUES ($1, $2, 'organizer', 'confirmed', CURRENT_TIMESTAMP)
    `, [newEvent.id, userId]);

     if (organizing_group_id) {
      try {
        const notificationsCreated = await createGroupEventNotification(
          organizing_group_id,
          newEvent.id,
          newEvent.title,
          'event_created'
        );
        console.log(`📢 Created ${notificationsCreated} notifications for group ${organizing_group_id} event: ${title}`);
      } catch (error) {
        console.error('Failed to create event notifications:', error);
        // Don't fail the event creation if notifications fail
      }
    }

    res.status(201).json({
      success: true,
      message: organizing_group_id 
        ? 'Group event created successfully' 
        : 'Event created successfully',
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
 * GET /api/events/groups/:groupId/events
 * Get all events organized by a specific group
 */
router.get('/groups/:groupId/events', eventsLimiter, [
  param('groupId').isInt({ min: 1 }).withMessage('Group ID must be a positive integer'),
  query('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Status must be upcoming, ongoing, completed, or cancelled'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
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

    const groupId = req.params.groupId;
    const { status = 'upcoming', limit = 20, offset = 0 } = req.query;
    const userId = req.user ? req.user.id : null;
    const pool = getPostgreSQLPool();

    // Check if user has access to group events
    const groupCheck = await pool.query(
      'SELECT is_private FROM groups WHERE id = $1',
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
        error: 'GROUP_NOT_FOUND'
      });
    }

    const isPrivateGroup = groupCheck.rows[0].is_private;

    // For private groups, verify membership
if (isPrivateGroup) {
  if (!userId) {
    return res.status(403).json({
      success: false,
      message: 'Authentication required for private group',
      error: 'AUTH_REQUIRED_PRIVATE_GROUP'
    });
  }
  
  const memberCheck = await pool.query(
    'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (memberCheck.rows.length === 0) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to private group events',
      error: 'PRIVATE_GROUP_ACCESS_DENIED'
    });
  }
}

    // Get group events
    const result = await pool.query(`
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.location_description, e.status, e.created_at, e.category,
        e.group_members_only, e.is_private,
        u.username as organizer_username,
        u.display_name as organizer_display_name,
        COUNT(ep.id) as participant_count
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.status = 'confirmed'
      WHERE e.organizing_group_id = $1 AND e.status = $2
      GROUP BY e.id, e.title, e.description, e.start_time, e.end_time,
               e.location_description, e.status, e.created_at, e.category,
               e.group_members_only, e.is_private, u.username, u.display_name
      ORDER BY e.start_time ASC
      LIMIT $3 OFFSET $4
    `, [groupId, status, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM events WHERE organizing_group_id = $1 AND status = $2',
      [groupId, status]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Group events retrieved successfully',
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
    console.error('Get group events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve group events',
      error: 'GET_GROUP_EVENTS_ERROR'
    });
  }
});

/**
 * PUT /api/events/:id/group
 * Assign or change the organizing group for an event (organizer only)
 */
router.put('/:id/group', verifyToken, eventsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Event ID must be a positive integer'),
  body('organizing_group_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Organizing group ID must be a positive integer'),
  body('group_members_only')
    .optional()
    .isBoolean()
    .withMessage('group_members_only must be a boolean')
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
    const { organizing_group_id, group_members_only } = req.body;
    const pool = getPostgreSQLPool();

    // Verify user is the event organizer
    const eventCheck = await pool.query(
      'SELECT organizer_id, organizing_group_id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND'
      });
    }

    if (eventCheck.rows[0].organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the event organizer can change group assignments',
        error: 'NOT_EVENT_ORGANIZER'
      });
    }

    // If assigning to a group, verify user has permissions
    if (organizing_group_id) {
      const groupMember = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [organizing_group_id, userId]
      );

      if (groupMember.rows.length === 0 || !['admin', 'moderator'].includes(groupMember.rows[0].role)) {
        return res.status(403).json({
          success: false,
          message: 'You must be a group admin or moderator to assign events to the group',
          error: 'INSUFFICIENT_GROUP_PERMISSIONS'
        });
      }
    }

    // Update event
    const result = await pool.query(`
      UPDATE events 
      SET organizing_group_id = $1, group_members_only = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, organizing_group_id, group_members_only, updated_at
    `, [organizing_group_id || null, group_members_only || false, eventId]);

    res.json({
      success: true,
      message: organizing_group_id 
        ? 'Event assigned to group successfully' 
        : 'Event removed from group successfully',
      data: {
        event: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update event group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event group assignment',
      error: 'UPDATE_EVENT_GROUP_ERROR'
    });
  }
});

// Add these endpoints to your routes/events.js file

/**
 * GET /api/events/:id
 * Get a specific event with details
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
    const userId = req.user ? req.user.id : null;
    const pool = getPostgreSQLPool();

    // Get event details
    const eventResult = await pool.query(`
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.location_description, e.status, e.created_at, e.category,
        e.organizing_group_id, e.group_members_only, e.is_private,
        u.username as organizer_username,
        u.display_name as organizer_display_name,
        g.name as organizing_group_name,
        COUNT(ep.id) as participant_count
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN groups g ON e.organizing_group_id = g.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.status = 'confirmed'
      WHERE e.id = $1
      GROUP BY e.id, e.title, e.description, e.start_time, e.end_time,
               e.location_description, e.status, e.created_at, e.category,
               e.organizing_group_id, e.group_members_only, e.is_private,
               u.username, u.display_name, g.name
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND'
      });
    }

    const event = eventResult.rows[0];

    // Check access permissions
    if (event.is_private && userId) {
      // Check if user has access to private event
      const hasAccess = await pool.query(`
        SELECT 1 FROM event_participants ep
        WHERE ep.event_id = $1 AND ep.user_id = $2
        UNION
        SELECT 1 FROM events e
        WHERE e.id = $1 AND e.organizer_id = $2
        UNION
        SELECT 1 FROM events e
        JOIN group_members gm ON e.organizing_group_id = gm.group_id
        WHERE e.id = $1 AND gm.user_id = $2
      `, [eventId, userId]);

      if (hasAccess.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private event',
          error: 'PRIVATE_EVENT_ACCESS_DENIED'
        });
      }
    } else if (event.is_private) {
      return res.status(403).json({
        success: false,
        message: 'Authentication required for private event',
        error: 'AUTH_REQUIRED_PRIVATE_EVENT'
      });
    }

    // Get user's participation status if authenticated
    let userParticipation = null;
    if (userId) {
      const participationResult = await pool.query(
        'SELECT role, status, registered_at FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );
      userParticipation = participationResult.rows[0] || null;
    }

    res.json({
      success: true,
      message: 'Event retrieved successfully',
      data: {
        event: event,
        user_participation: userParticipation
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

/**
 * POST /api/events/:id/join
 * Join an event
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

    // Get event details
    const eventResult = await pool.query(`
      SELECT 
        e.id, e.organizer_id, e.is_private, e.access_code, e.status,
        e.organizing_group_id, e.group_members_only
      FROM events e
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

    // Check if event is still active
    if (event.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot join event that is not upcoming',
        error: 'EVENT_NOT_JOINABLE'
      });
    }

    // Check if user is already participating
    const existingParticipation = await pool.query(
      'SELECT id, status FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (existingParticipation.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already participating in this event',
        error: 'ALREADY_PARTICIPATING'
      });
    }

    // Check access permissions
    if (event.is_private && event.access_code) {
      if (!access_code || access_code !== event.access_code) {
        return res.status(403).json({
          success: false,
          message: 'Invalid access code for private event',
          error: 'INVALID_ACCESS_CODE'
        });
      }
    }

    // Check group membership requirements
    if (event.group_members_only && event.organizing_group_id) {
      const groupMemberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [event.organizing_group_id, userId]
      );

      if (groupMemberCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'This event is restricted to group members only',
          error: 'GROUP_MEMBERS_ONLY'
        });
      }
    }

    // Add user as participant
    const result = await pool.query(`
      INSERT INTO event_participants (event_id, user_id, role, status, registered_at)
      VALUES ($1, $2, 'attendee', 'confirmed', CURRENT_TIMESTAMP)
      RETURNING id, role, status, registered_at
    `, [eventId, userId]);

    const participation = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Successfully joined event',
      data: {
        participation: participation
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
 * Leave an event
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

    // Check if user is participating
    const participationResult = await pool.query(
      'SELECT id, role FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (participationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'You are not participating in this event',
        error: 'NOT_PARTICIPATING'
      });
    }

    const participation = participationResult.rows[0];

    // Prevent organizer from leaving their own event
    if (participation.role === 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'Event organizers cannot leave their own events',
        error: 'ORGANIZER_CANNOT_LEAVE'
      });
    }

    // Remove participation
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