// routes/notifications.js - Complete Implementation
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { getPostgreSQLPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for notifications
const notificationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many notification requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

// ===========================================
// NOTIFICATION ENDPOINTS
// ===========================================

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
router.get('/', verifyToken, notificationsLimiter, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  
  query('unread_only')
    .optional()
    .isBoolean()
    .withMessage('unread_only must be a boolean'),
  
  query('type')
    .optional()
    .isIn(['event_created', 'event_updated', 'group_event', 'forum_post', 'group_joined', 'event_reminder'])
    .withMessage('Invalid notification type')
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
    const { limit = 20, offset = 0, unread_only = false, type } = req.query;
    const pool = getPostgreSQLPool();

    // Build query
    let query = `
      SELECT 
        n.id, n.type, n.title, n.content, n.related_type, n.related_id,
        n.is_read, n.created_at, n.expires_at, n.action_url
      FROM notifications n
      WHERE n.user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    // Filter conditions
    if (unread_only === 'true') {
      query += ` AND n.is_read = false`;
    }

    if (type) {
      query += ` AND n.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Only show non-expired notifications
    query += ` AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)`;

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get unread count
    const unreadCountResult = await pool.query(`
      SELECT COUNT(*) as unread_count
      FROM notifications 
      WHERE user_id = $1 AND is_read = false 
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `, [userId]);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM notifications 
      WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    const countParams = [userId];

    if (unread_only === 'true') {
      countQuery += ` AND is_read = false`;
    }

    if (type) {
      countQuery += ` AND type = $2`;
      countParams.push(type);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: result.rows,
        unread_count: parseInt(unreadCountResult.rows[0].unread_count),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: 'GET_NOTIFICATIONS_ERROR'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', verifyToken, notificationsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Notification ID must be a positive integer')
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

    const notificationId = req.params.id;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    // Update notification
    const result = await pool.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING id, is_read
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: 'MARK_READ_ERROR'
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', verifyToken, notificationsLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    const result = await pool.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updated_count: result.rowCount
      }
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: 'MARK_ALL_READ_ERROR'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', verifyToken, notificationsLimiter, [
  param('id').isInt({ min: 1 }).withMessage('Notification ID must be a positive integer')
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

    const notificationId = req.params.id;
    const userId = req.user.id;
    const pool = getPostgreSQLPool();

    const result = await pool.query(`
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: 'DELETE_NOTIFICATION_ERROR'
    });
  }
});

// ===========================================
// NOTIFICATION HELPER FUNCTIONS
// ===========================================

/**
 * Create notification for group event
 */
async function createGroupEventNotification(groupId, eventId, eventTitle, eventType = 'event_created') {
  try {
    const pool = getPostgreSQLPool();
    
    // Get all group members except the event creator
    const membersResult = await pool.query(`
      SELECT gm.user_id, u.username, e.organizer_id
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      JOIN events e ON e.id = $2
      WHERE gm.group_id = $1 AND gm.user_id != e.organizer_id
    `, [groupId, eventId]);

    // Create notifications for all group members (except organizer)
    for (const member of membersResult.rows) {
      await pool.query(`
        INSERT INTO notifications (
          user_id, type, title, content, related_type, related_id, 
          action_url, created_at
        )
        VALUES ($1, $2, $3, $4, 'event', $5, $6, CURRENT_TIMESTAMP)
      `, [
        member.user_id,
        eventType,
        `New Group Event: ${eventTitle}`,
        `Your group has organized a new event: ${eventTitle}. Check it out and join if you're interested!`,
        eventId,
        `/events/${eventId}`
      ]);
    }

    console.log(`📢 Created ${eventType} notifications for ${membersResult.rows.length} group members`);
    return membersResult.rows.length;
  } catch (error) {
    console.error('Error creating group event notifications:', error);
    return 0;
  }
}

/**
 * Create notification for new group member
 */
async function createGroupJoinNotification(groupId, newMemberUsername) {
  try {
    const pool = getPostgreSQLPool();
    
    // Get group admins and moderators
    const adminsResult = await pool.query(`
      SELECT gm.user_id, g.name as group_name
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.group_id = $1 AND gm.role IN ('admin', 'moderator')
    `, [groupId]);

    // Notify admins and moderators
    for (const admin of adminsResult.rows) {
      await pool.query(`
        INSERT INTO notifications (
          user_id, type, title, content, related_type, related_id,
          action_url, created_at
        )
        VALUES ($1, $2, $3, $4, 'group', $5, $6, CURRENT_TIMESTAMP)
      `, [
        admin.user_id,
        'group_joined',
        `New member joined ${admin.group_name}`,
        `${newMemberUsername} has joined your group. Welcome them to the community!`,
        groupId,
        `/groups/${groupId}`
      ]);
    }

    console.log(`📢 Created group join notifications for ${adminsResult.rows.length} group admins/moderators`);
    return adminsResult.rows.length;
  } catch (error) {
    console.error('Error creating group join notifications:', error);
    return 0;
  }
}

/**
 * Create event reminder notifications
 */
async function createEventReminders() {
  try {
    const pool = getPostgreSQLPool();
    
    // Get events starting in 24 hours
    const upcomingEvents = await pool.query(`
      SELECT e.id, e.title, e.start_time, ep.user_id
      FROM events e
      JOIN event_participants ep ON e.id = ep.event_id
      WHERE e.start_time BETWEEN CURRENT_TIMESTAMP + INTERVAL '23 hours'
      AND CURRENT_TIMESTAMP + INTERVAL '25 hours'
      AND e.status = 'upcoming'
      AND ep.status = 'confirmed'
    `);

    let remindersCreated = 0;

    // Create reminder notifications
    for (const event of upcomingEvents.rows) {
      // Check if reminder already sent
      const existingReminder = await pool.query(`
        SELECT id FROM notifications
        WHERE user_id = $1 AND type = 'event_reminder' 
        AND related_id = $2 AND related_type = 'event'
      `, [event.user_id, event.id]);

      if (existingReminder.rows.length === 0) {
        await pool.query(`
          INSERT INTO notifications (
            user_id, type, title, content, related_type, related_id,
            action_url, expires_at, created_at
          )
          VALUES ($1, $2, $3, $4, 'event', $5, $6, $7, CURRENT_TIMESTAMP)
        `, [
          event.user_id,
          'event_reminder',
          `Event Reminder: ${event.title}`,
          `Your event "${event.title}" starts tomorrow at ${new Date(event.start_time).toLocaleString()}. Don't forget to attend!`,
          event.id,
          `/events/${event.id}`,
          new Date(event.start_time) // Expire after event starts
        ]);
        remindersCreated++;
      }
    }

    console.log(`⏰ Created ${remindersCreated} event reminder notifications`);
    return remindersCreated;
  } catch (error) {
    console.error('Error creating event reminders:', error);
    return 0;
  }
}

/**
 * Clean up expired notifications
 */
async function cleanupExpiredNotifications() {
  try {
    const pool = getPostgreSQLPool();
    
    const result = await pool.query(`
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
    `);

    console.log(`🧹 Cleaned up ${result.rowCount} expired notifications`);
    return result.rowCount;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
}

// Export router and helper functions
module.exports = {
  router,
  createGroupEventNotification,
  createGroupJoinNotification,
  createEventReminders,
  cleanupExpiredNotifications
};