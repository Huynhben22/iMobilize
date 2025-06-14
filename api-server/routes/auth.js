// routes/auth.js - SIMPLIFIED VERSION (remove complex password validation temporarily)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { getPostgreSQLPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

// SIMPLIFIED validation rules - remove complex password requirements temporarily
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  // SIMPLIFIED: Just check minimum length
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('display_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name cannot exceed 50 characters'),
  
  // Accept both string and boolean
  body('terms_accepted')
    .custom((value) => {
      if (value === true || value === 'true') {
        return true;
      }
      throw new Error('You must accept the terms of service');
    })
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Raw request body:', req.body);
    console.log('Password length:', req.body.password ? req.body.password.length : 'undefined');
    console.log('Password preview:', req.body.password ? req.body.password.substring(0, 10) + '...' : 'undefined');
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ VALIDATION FAILED:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { username, email, password, display_name, bio, privacy_level = 'standard' } = req.body;

    console.log('✅ Validation passed, processing registration...');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Display name:', display_name);

    // Get database connection
    const pool = getPostgreSQLPool();

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ User already exists');
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists',
        error: 'USER_EXISTS'
      });
    }

    console.log('✅ User does not exist, proceeding with registration...');

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, bio, privacy_level, terms_accepted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, username, email, display_name, role, privacy_level, created_at`,
      [username, email, password_hash, display_name || username, bio || null, privacy_level, true]
    );

    const newUser = result.rows[0];
    console.log('✅ User created with ID:', newUser.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [newUser.id]
    );

    console.log('✅ REGISTRATION SUCCESSFUL');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          display_name: newUser.display_name,
          role: newUser.role,
          privacy_level: newUser.privacy_level,
          created_at: newUser.created_at
        }
      }
    });

  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', req.body.email);
    console.log('Password length:', req.body.password ? req.body.password.length : 'undefined');
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Login validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Get database connection
    const pool = getPostgreSQLPool();

    // Find user by email
    const result = await pool.query(
      'SELECT id, username, email, password_hash, display_name, role, privacy_level, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];
    console.log('✅ User found:', user.username);

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔍 Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log('✅ Password verified successfully');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    console.log('✅ LOGIN SUCCESSFUL for user:', user.username);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          privacy_level: user.privacy_level,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: 'LOGIN_ERROR'
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return user data
 */
router.get('/verify', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: 'VERIFICATION_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: 'LOGOUT_ERROR'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', verifyToken, [
  body('display_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name cannot exceed 50 characters'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('privacy_level')
    .optional()
    .isIn(['public', 'standard', 'private'])
    .withMessage('Privacy level must be public, standard, or private')
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

    const { display_name, bio, privacy_level } = req.body;
    const userId = req.user.id;

    // Get database connection
    const pool = getPostgreSQLPool();

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount}`);
      values.push(display_name);
      paramCount++;
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }

    if (privacy_level !== undefined) {
      updates.push(`privacy_level = $${paramCount}`);
      values.push(privacy_level);
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
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, email, display_name, bio, role, privacy_level, updated_at
    `;

    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: 'UPDATE_ERROR'
    });
  }
});

module.exports = router;