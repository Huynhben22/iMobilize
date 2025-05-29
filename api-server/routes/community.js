// routes/community.js
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { getPostgreSQLPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for community actions
const communityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many community requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

// Stricter rate limiting for posting
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 posts per windowMs
  message: {
    success: false,
    message: 'Too many posts, please try again later',
    error: 'POST_RATE_LIMIT_EXCEEDED'
  }
});

// Validation rules
const forumValidation = [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Forum title must be between 3 and 100 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  
  body('group_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer')
];

const postValidation = [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Post title must be between 3 and 100 characters')
    .trim(),
  
  body('content')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Post content must be between 10 and 5000 characters')
    .trim(),
  
  body('is_pinned')
    .optional()
    .isBoolean()
    .withMessage('is_pinned must be a boolean')
];

const commentValidation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters')
    .trim(),
  
  body('parent_comment_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent comment ID must be a positive integer')
];

// ===========================================
// FORUM MANAGEMENT ENDPOINTS
// ===========================================

/**
 * GET /api/community/forums
 * Get all forums (with optional filtering)
 */
router.get('/forums', communityLimiter, [
  query('group_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer'),
  
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

    const { group_id, limit = 20, offset = 0 } = req.query;
    const pool = getPostgreSQLPool();

    let query = `
      SELECT 
        f.id, f.title, f.description, f.group_id, f.created_at,
        u.username as moderator_username,
        u.display_name as moderator_display_name,
        g.name as group_name,
        COUNT(fp.id) as post_count,
        MAX(fp.created_at) as last_post_at
      FROM forums f
      LEFT JOIN users u ON f.moderator_id = u.id
      LEFT JOIN groups g ON f.group_id = g.id
      LEFT JOIN forum_posts fp ON f.id = fp.forum_id
    `;

    const params = [];
    const conditions = [];
    let paramCount = 1;

    if (group_id) {
      conditions.push(`f.group_id = $${paramCount}`);
      params.push(group_id);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY f.id, f.title, f.description, f.group_id, f.created_at, 
               u.username, u.display_name, g.name
      ORDER BY f.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM forums f';
    if (group_id) {
      countQuery += ' WHERE f.group_id = $1';
      const countResult = await pool.query(countQuery, [group_id]);
      var totalCount = parseInt(countResult.rows[0].count);
    } else {
      const countResult = await pool.query(countQuery);
      var totalCount = parseInt(countResult.rows[0].count);
    }

    res.json({
      success: true,
      message: 'Forums retrieved successfully',
      data: {
        forums: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve forums',
      error: 'GET_FORUMS_ERROR'
    });
  }
});

/**
 * POST /api/community/forums
 * Create a new forum (requires authentication)
 */
router.post('/forums', verifyToken, communityLimiter, forumValidation, async (req, res) => {
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

    const { title, description, group_id } = req.body;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // If group_id is provided, verify user is a member
    if (group_id) {
      const memberCheck = await pool.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [group_id, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of the group to create a forum',
          error: 'NOT_GROUP_MEMBER'
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO forums (title, description, moderator_id, group_id, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id, title, description, group_id, created_at`,
      [title, description || null, userId, group_id || null]
    );

    const newForum = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Forum created successfully',
      data: {
        forum: newForum
      }
    });

  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create forum',
      error: 'CREATE_FORUM_ERROR'
    });
  }
});

/**
 * GET /api/community/forums/:id
 * Get a specific forum with recent posts
 */
router.get('/forums/:id', communityLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Forum ID must be a positive integer')
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

    const forumId = req.params.id;
    const pool = getPostgreSQLPool();

    // Get forum details
    const forumResult = await pool.query(`
      SELECT 
        f.id, f.title, f.description, f.group_id, f.created_at,
        u.username as moderator_username,
        u.display_name as moderator_display_name,
        g.name as group_name
      FROM forums f
      LEFT JOIN users u ON f.moderator_id = u.id
      LEFT JOIN groups g ON f.group_id = g.id
      WHERE f.id = $1
    `, [forumId]);

    if (forumResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
        error: 'FORUM_NOT_FOUND'
      });
    }

    // Get recent posts (last 10)
    const postsResult = await pool.query(`
      SELECT 
        fp.id, fp.title, fp.created_at, fp.is_pinned, fp.is_locked,
        u.username as author_username,
        u.display_name as author_display_name,
        COUNT(pc.id) as comment_count
      FROM forum_posts fp
      LEFT JOIN users u ON fp.user_id = u.id
      LEFT JOIN post_comments pc ON fp.id = pc.post_id
      WHERE fp.forum_id = $1
      GROUP BY fp.id, fp.title, fp.created_at, fp.is_pinned, fp.is_locked,
               u.username, u.display_name
      ORDER BY fp.is_pinned DESC, fp.created_at DESC
      LIMIT 10
    `, [forumId]);

    res.json({
      success: true,
      message: 'Forum retrieved successfully',
      data: {
        forum: forumResult.rows[0],
        recent_posts: postsResult.rows
      }
    });

  } catch (error) {
    console.error('Get forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve forum',
      error: 'GET_FORUM_ERROR'
    });
  }
});

// ===========================================
// FORUM POSTS ENDPOINTS
// ===========================================

/**
 * GET /api/community/forums/:id/posts
 * Get all posts in a forum
 */
router.get('/forums/:id/posts', communityLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Forum ID must be a positive integer'),
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

    const forumId = req.params.id;
    const { limit = 20, offset = 0 } = req.query;
    const pool = getPostgreSQLPool();

    // Verify forum exists
    const forumCheck = await pool.query('SELECT id FROM forums WHERE id = $1', [forumId]);
    if (forumCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
        error: 'FORUM_NOT_FOUND'
      });
    }

    // Get posts
    const postsResult = await pool.query(`
      SELECT 
        fp.id, fp.title, fp.content, fp.created_at, fp.updated_at,
        fp.is_pinned, fp.is_locked,
        u.username as author_username,
        u.display_name as author_display_name,
        COUNT(pc.id) as comment_count
      FROM forum_posts fp
      LEFT JOIN users u ON fp.user_id = u.id
      LEFT JOIN post_comments pc ON fp.id = pc.post_id
      WHERE fp.forum_id = $1
      GROUP BY fp.id, fp.title, fp.content, fp.created_at, fp.updated_at,
               fp.is_pinned, fp.is_locked, u.username, u.display_name
      ORDER BY fp.is_pinned DESC, fp.created_at DESC
      LIMIT $2 OFFSET $3
    `, [forumId, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM forum_posts WHERE forum_id = $1',
      [forumId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts: postsResult.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve posts',
      error: 'GET_POSTS_ERROR'
    });
  }
});

/**
 * POST /api/community/forums/:id/posts
 * Create a new post in a forum
 */
router.post('/forums/:id/posts', verifyToken, postLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Forum ID must be a positive integer'),
  ...postValidation
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

    const forumId = req.params.id;
    const { title, content, is_pinned = false } = req.body;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Verify forum exists
    const forumCheck = await pool.query('SELECT id FROM forums WHERE id = $1', [forumId]);
    if (forumCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found',
        error: 'FORUM_NOT_FOUND'
      });
    }

    // Only moderators/admins can pin posts
    const canPin = req.user.role === 'admin' || req.user.role === 'moderator';
    const finalIsPinned = canPin ? is_pinned : false;

    const result = await pool.query(`
      INSERT INTO forum_posts (forum_id, user_id, title, content, created_at, updated_at, is_pinned)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5)
      RETURNING id, title, content, created_at, is_pinned, is_locked
    `, [forumId, userId, title, content, finalIsPinned]);

    const newPost = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: newPost
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: 'CREATE_POST_ERROR'
    });
  }
});

/**
 * GET /api/community/posts/:id
 * Get a specific post with comments
 */
router.get('/posts/:id', communityLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Post ID must be a positive integer')
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

    const postId = req.params.id;
    const pool = getPostgreSQLPool();

    // Get post details
    const postResult = await pool.query(`
      SELECT 
        fp.id, fp.title, fp.content, fp.created_at, fp.updated_at,
        fp.is_pinned, fp.is_locked, fp.forum_id,
        u.username as author_username,
        u.display_name as author_display_name,
        f.title as forum_title
      FROM forum_posts fp
      LEFT JOIN users u ON fp.user_id = u.id
      LEFT JOIN forums f ON fp.forum_id = f.id
      WHERE fp.id = $1
    `, [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'POST_NOT_FOUND'
      });
    }

    // Get comments (with nested structure for replies)
    const commentsResult = await pool.query(`
      SELECT 
        pc.id, pc.content, pc.created_at, pc.updated_at, pc.parent_comment_id,
        u.username as author_username,
        u.display_name as author_display_name
      FROM post_comments pc
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = $1
      ORDER BY pc.parent_comment_id NULLS FIRST, pc.created_at ASC
    `, [postId]);

    // Organize comments into nested structure
    const comments = [];
    const commentMap = new Map();

    commentsResult.rows.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);

      if (comment.parent_comment_id === null) {
        comments.push(comment);
      } else {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    res.json({
      success: true,
      message: 'Post retrieved successfully',
      data: {
        post: postResult.rows[0],
        comments: comments
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve post',
      error: 'GET_POST_ERROR'
    });
  }
});

// ===========================================
// COMMENTS ENDPOINTS
// ===========================================

/**
 * POST /api/community/posts/:id/comments
 * Add a comment to a post
 */
router.post('/posts/:id/comments', verifyToken, postLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  ...commentValidation
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

    const postId = req.params.id;
    const { content, parent_comment_id } = req.body;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Verify post exists and is not locked
    const postCheck = await pool.query(
      'SELECT id, is_locked FROM forum_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'POST_NOT_FOUND'
      });
    }

    if (postCheck.rows[0].is_locked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on locked post',
        error: 'POST_LOCKED'
      });
    }

    // If replying to a comment, verify parent comment exists
    if (parent_comment_id) {
      const parentCheck = await pool.query(
        'SELECT id FROM post_comments WHERE id = $1 AND post_id = $2',
        [parent_comment_id, postId]
      );

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
          error: 'PARENT_COMMENT_NOT_FOUND'
        });
      }
    }

    const result = await pool.query(`
      INSERT INTO post_comments (post_id, user_id, content, parent_comment_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, content, created_at, parent_comment_id
    `, [postId, userId, content, parent_comment_id || null]);

    const newComment = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: newComment
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: 'CREATE_COMMENT_ERROR'
    });
  }
});

/**
 * PUT /api/community/posts/:postId/comments/:commentId
 * Update a comment (only by author)
 */
router.put('/posts/:postId/comments/:commentId', verifyToken, [
  param('postId').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  param('commentId').isInt({ min: 1 }).withMessage('Comment ID must be a positive integer'),
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters')
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

    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Verify comment exists and user is the author
    const commentCheck = await pool.query(
      'SELECT id, user_id FROM post_comments WHERE id = $1 AND post_id = $2',
      [commentId, postId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'COMMENT_NOT_FOUND'
      });
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments',
        error: 'NOT_COMMENT_AUTHOR'
      });
    }

    const result = await pool.query(`
      UPDATE post_comments 
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, content, updated_at
    `, [content, commentId]);

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: 'UPDATE_COMMENT_ERROR'
    });
  }
});

/**
 * DELETE /api/community/posts/:postId/comments/:commentId
 * Delete a comment (by author or moderator)
 */
router.delete('/posts/:postId/comments/:commentId', verifyToken, [
  param('postId').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  param('commentId').isInt({ min: 1 }).withMessage('Comment ID must be a positive integer')
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

    const { postId, commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const pool = getPostgreSQLPool();

    // Verify comment exists
    const commentCheck = await pool.query(
      'SELECT id, user_id FROM post_comments WHERE id = $1 AND post_id = $2',
      [commentId, postId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'COMMENT_NOT_FOUND'
      });
    }

    // Check if user can delete (author or moderator/admin)
    const canDelete = commentCheck.rows[0].user_id === userId || 
                     userRole === 'admin' || 
                     userRole === 'moderator';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
        error: 'NOT_AUTHORIZED'
      });
    }

    await pool.query('DELETE FROM post_comments WHERE id = $1', [commentId]);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: 'DELETE_COMMENT_ERROR'
    });
  }
});

module.exports = router;