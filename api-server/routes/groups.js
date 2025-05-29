// routes/groups.js
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { getPostgreSQLPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for groups actions
const groupsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many group requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

// Stricter rate limiting for creating groups
const createGroupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 group creations per windowMs
  message: {
    success: false,
    message: 'Too many group creations, please try again later',
    error: 'CREATE_GROUP_RATE_LIMIT_EXCEEDED'
  }
});

// Validation rules
const groupValidation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('is_private must be a boolean'),
  
  body('cover_image_url')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL')
];

const memberActionValidation = [
  body('role')
    .optional()
    .isIn(['member', 'moderator', 'admin'])
    .withMessage('Role must be member, moderator, or admin')
];

/**
 * GET /api/groups/my-groups
 * Get current user's groups (MOVED TO TOP TO AVOID ROUTE CONFLICT)
 */
router.get('/my-groups', verifyToken, groupsLimiter, [
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

    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const pool = getPostgreSQLPool();

    const result = await pool.query(`
      SELECT 
        g.id, g.name, g.description, g.is_private, g.cover_image_url,
        g.created_at, g.updated_at,
        gm.role, gm.joined_at,
        u.username as creator_username,
        u.display_name as creator_display_name,
        COUNT(gm2.id) as member_count
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id
      WHERE gm.user_id = $1
      GROUP BY g.id, g.name, g.description, g.is_private, g.cover_image_url,
               g.created_at, g.updated_at, gm.role, gm.joined_at,
               u.username, u.display_name
      ORDER BY gm.joined_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM group_members WHERE user_id = $1',
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'User groups retrieved successfully',
      data: {
        groups: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user groups',
      error: 'GET_USER_GROUPS_ERROR'
    });
  }
});

// ===========================================
// GROUP MANAGEMENT ENDPOINTS
// ===========================================

/**
 * GET /api/groups
 * Get all public groups (with optional filtering and pagination)
 */
router.get('/', groupsLimiter, [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  
  query('include_private')
    .optional()
    .isBoolean()
    .withMessage('include_private must be a boolean')
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

    const { search, limit = 20, offset = 0, include_private = false } = req.query;
    const pool = getPostgreSQLPool();

    let query = `
      SELECT 
        g.id, g.name, g.description, g.is_private, g.created_at, g.updated_at,
        u.username as creator_username,
        u.display_name as creator_display_name,
        COUNT(gm.id) as member_count,
        COUNT(CASE WHEN gm.role = 'admin' OR gm.role = 'moderator' THEN 1 END) as moderator_count
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
    `;

    const params = [];
    const conditions = [];
    let paramCount = 1;

    // Privacy filter
    if (!include_private) {
      conditions.push(`g.is_private = false`);
    }

    // Search filter
    if (search) {
      conditions.push(`(g.name ILIKE $${paramCount} OR g.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY g.id, g.name, g.description, g.is_private, g.created_at, g.updated_at,
               u.username, u.display_name
      ORDER BY g.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM groups g';
    let countParams = [];
    
    if (!include_private || search) {
      const countConditions = [];
      let countParamCount = 1;
      
      if (!include_private) {
        countConditions.push('g.is_private = false');
      }
      
      if (search) {
        countConditions.push(`(g.name ILIKE $${countParamCount} OR g.description ILIKE $${countParamCount})`);
        countParams.push(`%${search}%`);
        countParamCount++;
      }
      
      if (countConditions.length > 0) {
        countQuery += ` WHERE ${countConditions.join(' AND ')}`;
      }
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Groups retrieved successfully',
      data: {
        groups: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve groups',
      error: 'GET_GROUPS_ERROR'
    });
  }
});

/**
 * POST /api/groups
 * Create a new group (requires authentication)
 */
router.post('/', verifyToken, createGroupLimiter, groupValidation, async (req, res) => {
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

    const { name, description, is_private = false, cover_image_url } = req.body;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Check if group name already exists
    const existingGroup = await pool.query(
      'SELECT id FROM groups WHERE name = $1',
      [name]
    );

    if (existingGroup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Group name already exists',
        error: 'GROUP_NAME_EXISTS'
      });
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create group
      const groupResult = await client.query(
        `INSERT INTO groups (name, description, creator_id, is_private, cover_image_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, name, description, is_private, created_at`,
        [name, description || null, userId, is_private, cover_image_url || null]
      );

      const newGroup = groupResult.rows[0];

      // Add creator as admin member
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role, joined_at)
         VALUES ($1, $2, 'admin', CURRENT_TIMESTAMP)`,
        [newGroup.id, userId]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: {
          group: newGroup
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: 'CREATE_GROUP_ERROR'
    });
  }
});

/**
 * GET /api/groups/:id
 * Get a specific group with member information
 */
router.get('/:id', groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer')
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

    const groupId = req.params.id;
    const userId = req.user ? req.user.id : null;
    const pool = getPostgreSQLPool();

    // Get group details
    const groupResult = await pool.query(`
      SELECT 
        g.id, g.name, g.description, g.is_private, g.cover_image_url,
        g.created_at, g.updated_at,
        u.username as creator_username,
        u.display_name as creator_display_name
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      WHERE g.id = $1
    `, [groupId]);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
        error: 'GROUP_NOT_FOUND'
      });
    }

    const group = groupResult.rows[0];

    // Check if user has access to private group
    if (group.is_private && userId) {
      const memberCheck = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private group',
          error: 'PRIVATE_GROUP_ACCESS_DENIED'
        });
      }
      
      group.user_role = memberCheck.rows[0].role;
    } else if (group.is_private) {
      return res.status(403).json({
        success: false,
        message: 'Authentication required for private group',
        error: 'AUTH_REQUIRED_PRIVATE_GROUP'
      });
    }

    // Get member information (limited for privacy)
    const membersResult = await pool.query(`
      SELECT 
        gm.role, gm.joined_at,
        u.username, u.display_name,
        CASE 
          WHEN gm.role IN ('admin', 'moderator') THEN u.profile_image_url
          ELSE NULL
        END as profile_image_url
      FROM group_members gm
      LEFT JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY 
        CASE gm.role 
          WHEN 'admin' THEN 1
          WHEN 'moderator' THEN 2
          ELSE 3
        END,
        gm.joined_at ASC
      LIMIT 50
    `, [groupId]);

    // Get recent group activity (forums, events)
    const forumsResult = await pool.query(`
      SELECT id, title, created_at
      FROM forums 
      WHERE group_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [groupId]);

    // Get group statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(gm.id) as total_members,
        COUNT(CASE WHEN gm.role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN gm.role = 'moderator' THEN 1 END) as moderator_count,
        COUNT(f.id) as forum_count
      FROM group_members gm
      LEFT JOIN forums f ON f.group_id = $1
      WHERE gm.group_id = $1
    `, [groupId]);

    res.json({
      success: true,
      message: 'Group retrieved successfully',
      data: {
        group: group,
        members: membersResult.rows,
        recent_forums: forumsResult.rows,
        statistics: statsResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve group',
      error: 'GET_GROUP_ERROR'
    });
  }
});

/**
 * PUT /api/groups/:id
 * Update group information (admin/moderator only)
 */
router.put('/:id', verifyToken, groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('is_private must be a boolean'),
  body('cover_image_url')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL')
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

    const groupId = req.params.id;
    const userId = req.user.id;
    const { name, description, is_private, cover_image_url } = req.body;
    const pool = getPostgreSQLPool();

    // Check if user has admin/moderator role in group
    const memberCheck = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
        error: 'NOT_GROUP_MEMBER'
      });
    }

    const userRole = memberCheck.rows[0].role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update group',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Check if new name conflicts with existing group
    if (name) {
      const existingGroup = await pool.query(
        'SELECT id FROM groups WHERE name = $1 AND id != $2',
        [name, groupId]
      );

      if (existingGroup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Group name already exists',
          error: 'GROUP_NAME_EXISTS'
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (is_private !== undefined) {
      updates.push(`is_private = $${paramCount}`);
      values.push(is_private);
      paramCount++;
    }

    if (cover_image_url !== undefined) {
      updates.push(`cover_image_url = $${paramCount}`);
      values.push(cover_image_url);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        error: 'NO_UPDATES'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(groupId);

    const query = `
      UPDATE groups 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, description, is_private, cover_image_url, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: {
        group: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group',
      error: 'UPDATE_GROUP_ERROR'
    });
  }
});

// ===========================================
// GROUP MEMBERSHIP ENDPOINTS
// ===========================================

/**
 * POST /api/groups/:id/join
 * Join a group (public groups) or request to join (private groups)
 */
router.post('/:id/join', verifyToken, groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer')
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

    const groupId = req.params.id;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Check if group exists
    const groupResult = await pool.query(
      'SELECT id, is_private FROM groups WHERE id = $1',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
        error: 'GROUP_NOT_FOUND'
      });
    }

    const group = groupResult.rows[0];

    // Check if user is already a member
    const existingMember = await pool.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group',
        error: 'ALREADY_MEMBER'
      });
    }

    // For public groups, join immediately
    // For private groups, this would typically create a join request
    // For simplicity, we'll allow immediate joining for now
    const result = await pool.query(
      `INSERT INTO group_members (group_id, user_id, role, joined_at)
       VALUES ($1, $2, 'member', CURRENT_TIMESTAMP)
       RETURNING id, role, joined_at`,
      [groupId, userId]
    );

    const responseMessage = group.is_private 
      ? 'Join request sent successfully' 
      : 'Successfully joined group';

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        membership: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group',
      error: 'JOIN_GROUP_ERROR'
    });
  }
});

/**
 * DELETE /api/groups/:id/leave
 * Leave a group
 */
router.delete('/:id/leave', verifyToken, groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer')
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

    const groupId = req.params.id;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Check if user is a member
    const memberResult = await pool.query(
      'SELECT id, role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of this group',
        error: 'NOT_MEMBER'
      });
    }

    const memberRole = memberResult.rows[0].role;

    // Check if this is the last admin
    if (memberRole === 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) FROM group_members WHERE group_id = $1 AND role = $2',
        [groupId, 'admin']
      );

      if (parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave group as the last admin. Transfer admin role first.',
          error: 'LAST_ADMIN_CANNOT_LEAVE'
        });
      }
    }

    // Remove member
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    res.json({
      success: true,
      message: 'Successfully left the group'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group',
      error: 'LEAVE_GROUP_ERROR'
    });
  }
});

/**
 * GET /api/groups/:id/members
 * Get group members (with role-based visibility)
 */
router.get('/:id/members', groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  query('role')
    .optional()
    .isIn(['member', 'moderator', 'admin'])
    .withMessage('Role must be member, moderator, or admin')
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

    const groupId = req.params.id;
    const userId = req.user ? req.user.id : null;
    const { limit = 50, offset = 0, role } = req.query;
    const pool = getPostgreSQLPool();

    // Check if group exists and if it's private
    const groupResult = await pool.query(
      'SELECT is_private FROM groups WHERE id = $1',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
        error: 'GROUP_NOT_FOUND'
      });
    }

    const isPrivate = groupResult.rows[0].is_private;

    // Check access for private groups
    if (isPrivate && userId) {
      const memberCheck = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private group members',
          error: 'PRIVATE_GROUP_ACCESS_DENIED'
        });
      }
    } else if (isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Authentication required for private group',
        error: 'AUTH_REQUIRED_PRIVATE_GROUP'
      });
    }

    // Build members query
    let query = `
      SELECT 
        gm.role, gm.joined_at,
        u.username, u.display_name,
        CASE 
          WHEN gm.role IN ('admin', 'moderator') THEN u.profile_image_url
          ELSE NULL
        END as profile_image_url
      FROM group_members gm
      LEFT JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
    `;

    const params = [groupId];
    let paramCount = 2;

    if (role) {
      query += ` AND gm.role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    query += `
      ORDER BY 
        CASE gm.role 
          WHEN 'admin' THEN 1
          WHEN 'moderator' THEN 2
          ELSE 3
        END,
        gm.joined_at ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM group_members WHERE group_id = $1';
    let countParams = [groupId];

    if (role) {
      countQuery += ' AND role = $2';
      countParams.push(role);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Group members retrieved successfully',
      data: {
        members: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve group members',
      error: 'GET_MEMBERS_ERROR'
    });
  }
});

/**
 * PUT /api/groups/:id/members/:userId
 * Update member role (admin only)
 */
router.put('/:id/members/:userId', verifyToken, groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer'),
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  ...memberActionValidation
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

    const groupId = req.params.id;
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;
    const { role } = req.body;
    const pool = getPostgreSQLPool();

    // Check if current user is admin
    const currentUserRole = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, currentUserId]
    );

    if (currentUserRole.rows.length === 0 || currentUserRole.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can change member roles',
        error: 'ADMIN_REQUIRED'
      });
    }

    // Check if target user is a member
    const targetMember = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    if (targetMember.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this group',
        error: 'USER_NOT_MEMBER'
      });
    }

    // Prevent self-demotion if last admin
    if (currentUserId === targetUserId && role !== 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) FROM group_members WHERE group_id = $1 AND role = $2',
        [groupId, 'admin']
      );

      if (parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote yourself as the last admin',
          error: 'LAST_ADMIN_CANNOT_DEMOTE_SELF'
        });
      }
    }

    // Update member role
    const result = await pool.query(
      `UPDATE group_members 
       SET role = $1 
       WHERE group_id = $2 AND user_id = $3
       RETURNING role, joined_at`,
      [role, groupId, targetUserId]
    );

    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        membership: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role',
      error: 'UPDATE_MEMBER_ROLE_ERROR'
    });
  }
});

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove member from group (admin/moderator only)
 */
router.delete('/:id/members/:userId', verifyToken, groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer'),
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer')
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

    const groupId = req.params.id;
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;
    const pool = getPostgreSQLPool();

    // Check current user's role
    const currentUserRole = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, currentUserId]
    );

    if (currentUserRole.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
        error: 'NOT_GROUP_MEMBER'
      });
    }

    const userRole = currentUserRole.rows[0].role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to remove members',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Check target user's role
    const targetMember = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    if (targetMember.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this group',
        error: 'USER_NOT_MEMBER'
      });
    }

    const targetRole = targetMember.rows[0].role;

    // Moderators cannot remove admins or other moderators
    if (userRole === 'moderator' && ['admin', 'moderator'].includes(targetRole)) {
      return res.status(403).json({
        success: false,
        message: 'Moderators cannot remove admins or other moderators',
        error: 'INSUFFICIENT_PERMISSIONS_FOR_ROLE'
      });
    }

    // Prevent removing the last admin
    if (targetRole === 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) FROM group_members WHERE group_id = $1 AND role = $2',
        [groupId, 'admin']
      );

      if (parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last admin from the group',
          error: 'CANNOT_REMOVE_LAST_ADMIN'
        });
      }
    }

    // Remove member
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    res.json({
      success: true,
      message: 'Member removed from group successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: 'REMOVE_MEMBER_ERROR'
    });
  }
});

/**
 * DELETE /api/groups/:id
 * Delete a group (admin only)
 */
router.delete('/:id', verifyToken, groupsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Group ID must be a positive integer')
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

    const groupId = req.params.id;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Check if user is admin of the group
    const memberCheck = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can delete the group',
        error: 'ADMIN_REQUIRED'
      });
    }

    // Start transaction for cascading deletions
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete related forums (if any)
      await client.query('DELETE FROM forums WHERE group_id = $1', [groupId]);

      // Delete group members
      await client.query('DELETE FROM group_members WHERE group_id = $1', [groupId]);

      // Delete the group
      await client.query('DELETE FROM groups WHERE id = $1', [groupId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Group deleted successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group',
      error: 'DELETE_GROUP_ERROR'
    });
  }
});

module.exports = router;