const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

let LegalDataManager, WashingtonLegalService;

try {
  const { LegalDataManager: LDM } = require('../services/LegalDataManager');
  const { WashingtonLegalService: WLS } = require('../services/WashingtonLegalService');
  LegalDataManager = LDM;
  WashingtonLegalService = WLS;
} catch (error) {
  console.log('⚠️ Legal services not available:', error.message);
}

/**
 * GET /api/legal-test/status
 * Get detailed status of legal data system
 */
router.get('/status', async (req, res) => {
  try {
    if (!LegalDataManager) {
      return res.status(503).json({
        success: false,
        message: 'Legal services not available',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    const status = await LegalDataManager.getUpdateStatus();
    const cacheStats = WashingtonLegalService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        ...status,
        cache: cacheStats,
        systemHealth: 'operational'
      }
    });
  } catch (error) {
    console.error('❌ Error getting legal system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error.message
    });
  }
});

/**
 * GET /api/legal-test/citations
 * Test fetching RCW citations
 */
router.get('/citations', async (req, res) => {
  try {
    if (!WashingtonLegalService) {
      return res.status(503).json({
        success: false,
        message: 'Washington Legal Service not available',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    console.log('🧪 Testing RCW citations fetch...');
    
    const citations = await WashingtonLegalService.fetchRCWCitations();
    
    res.json({
      success: true,
      message: 'Citations test successful',
      data: {
        count: citations.length,
        citations: citations.slice(0, 10), // First 10 for preview
        cacheStats: WashingtonLegalService.getCacheStats()
      }
    });
  } catch (error) {
    console.error('❌ Citations test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Citations test failed',
      error: error.message
    });
  }
});

/**
 * GET /api/legal-test/content/:cite
 * Test fetching content for a specific RCW
 */
router.get('/content/:cite', async (req, res) => {
  try {
    if (!WashingtonLegalService) {
      return res.status(503).json({
        success: false,
        message: 'Washington Legal Service not available',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    const cite = req.params.cite;
    console.log(`🧪 Testing content fetch for ${cite}...`);
    
    const content = await WashingtonLegalService.fetchRCWContent(cite);
    
    res.json({
      success: true,
      message: `Content test for ${cite} successful`,
      data: content
    });
  } catch (error) {
    console.error(`❌ Content test for ${req.params.cite} failed:`, error);
    res.status(500).json({
      success: false,
      message: `Content test for ${req.params.cite} failed`,
      error: error.message
    });
  }
});

/**
 * GET /api/legal-test/search
 * Test search functionality
 */
router.get('/search', async (req, res) => {
  try {
    if (!LegalDataManager) {
      return res.status(503).json({
        success: false,
        message: 'Legal Data Manager not available',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    const { q, category, penalty, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) parameter is required'
      });
    }
    
    const results = await LegalDataManager.searchLegalDocuments(q, {
      category,
      penalty,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      message: 'Search completed successfully',
      data: results
    });
  } catch (error) {
    console.error('❌ Search test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Search test failed',
      error: error.message
    });
  }
});

/**
 * POST /api/legal-test/update-force
 * Force update all legal data (protected)
 */
router.post('/update-force', verifyToken, async (req, res) => {
  try {
    if (!LegalDataManager || !WashingtonLegalService) {
      return res.status(503).json({
        success: false,
        message: 'Legal services not available',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    console.log('🔄 Starting forced legal data update...');
    
    // Clear cache first
    WashingtonLegalService.clearCache();
    
    const result = await LegalDataManager.forceUpdate((progress) => {
      console.log(`📊 Update progress: ${progress.stage} - ${progress.progress}%`);
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'Legal data updated successfully' : 'Update completed with errors',
      data: result
    });
  } catch (error) {
    console.error('❌ Error during forced update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update legal data',
      error: error.message
    });
  }
});

/**
 * GET /api/legal-test/help
 * Show all available test endpoints
 */
router.get('/help', (req, res) => {
  res.json({
    success: true,
    message: 'Legal Data Test API Help',
    endpoints: {
      'GET /api/legal-test/status': 'Get system status and health information',
      'GET /api/legal-test/citations': 'Test fetching RCW citations from official API',
      'GET /api/legal-test/content/:cite': 'Test fetching content for a specific RCW (e.g., RCW%209A.84.010)',
      'GET /api/legal-test/search?q=term': 'Test search functionality (add &category=X &penalty=Y for filters)',
      'POST /api/legal-test/update-force': 'Force update all legal data (requires auth)',
      'GET /api/legal-test/help': 'Show this help information'
    },
    examples: {
      testSpecificRCW: 'GET /api/legal-test/content/RCW%209A.84.010',
      searchLaws: 'GET /api/legal-test/search?q=riot&category=protest-related'
    },
    notes: [
      'Use URL encoding for RCW cites in URLs (space = %20)',
      'Check /api/legal-test/status first to verify system health',
      'Services may not be available if legal tables are not set up in database'
    ]
  });
});

/**
 * GET /api/legal-test/hello
 * Simple test endpoint to verify routes are working
 */
router.get('/hello', (req, res) => {
  res.json({
    success: true,
    message: 'Legal test routes are working!',
    timestamp: new Date().toISOString(),
    servicesAvailable: {
      LegalDataManager: !!LegalDataManager,
      WashingtonLegalService: !!WashingtonLegalService
    }
  });
});
// Add this to your api-server/routes/legal-test.js file

/**
 * POST /api/legal-test/update-single
 * Update a single RCW in the database (for testing, no auth required)
 */
router.post('/update-single', async (req, res) => {
  try {
    if (!LegalDataManager || !WashingtonLegalService) {
      return res.status(503).json({
        success: false,
        message: 'Legal services not available',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    const { cite } = req.body;
    
    if (!cite) {
      return res.status(400).json({
        success: false,
        message: 'cite parameter is required in request body'
      });
    }

    console.log(`🔄 Updating single RCW: ${cite}...`);
    
    // Clear cache for fresh fetch
    WashingtonLegalService.clearCache();
    
    // Fetch fresh content
    const content = await WashingtonLegalService.fetchRCWContent(cite);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: `Failed to fetch content for ${cite}`,
        error: 'CONTENT_NOT_FOUND'
      });
    }

    // Save to database
    const { getPostgreSQLPool } = require('../config/database');
    const pool = getPostgreSQLPool();

    const result = await pool.query(`
      INSERT INTO legal_documents (
        cite, title, content, penalty, summary, source_url, 
        category, jurisdiction, last_updated, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (cite) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        penalty = EXCLUDED.penalty,
        summary = EXCLUDED.summary,
        source_url = EXCLUDED.source_url,
        last_updated = EXCLUDED.last_updated
      RETURNING id, cite, title, penalty, last_updated
    `, [
      cite, 
      content.title, 
      content.content, 
      content.penalty, 
      content.summary, 
      content.source,
      'protest-related',
      'Washington State'
    ]);

    const savedDoc = result.rows[0];

    res.json({
      success: true,
      message: `Successfully updated ${cite} in database`,
      data: {
        scraped: content,
        saved: savedDoc,
        isNew: result.rowCount === 1
      }
    });

  } catch (error) {
    console.error('❌ Single update failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update RCW',
      error: error.message
    });
  }
});

/**
 * GET /api/legal-test/verify-storage/:cite
 * Verify that a specific RCW is properly stored in database
 */
router.get('/verify-storage/:cite', async (req, res) => {
  try {
    if (!LegalDataManager) {
      return res.status(503).json({
        success: false,
        message: 'Legal Data Manager not available',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    const cite = req.params.cite;
    console.log(`🔍 Verifying storage for ${cite}...`);

    // Get from database
    const dbDocument = await LegalDataManager.getLegalDataByCite(cite);
    
    if (!dbDocument) {
      return res.status(404).json({
        success: false,
        message: `${cite} not found in database`,
        cite: cite
      });
    }

    // Validate data quality
    const validation = {
      hasTitle: !!dbDocument.title && dbDocument.title.length > 0,
      hasContent: !!dbDocument.content && dbDocument.content.length > 50,
      hasPenalty: !!dbDocument.penalty && dbDocument.penalty.length > 0,
      hasSummary: !!dbDocument.summary && dbDocument.summary.length > 0,
      hasSource: !!dbDocument.source_url,
      contentLength: dbDocument.content ? dbDocument.content.length : 0,
      lastUpdated: dbDocument.last_updated
    };

    const isValid = validation.hasTitle && validation.hasContent && 
                   validation.hasPenalty && validation.hasSummary;

    res.json({
      success: true,
      message: `Storage verification for ${cite}`,
      data: {
        cite: cite,
        document: dbDocument,
        validation: validation,
        isValid: isValid,
        dataQuality: isValid ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      }
    });

  } catch (error) {
    console.error(`❌ Storage verification failed for ${req.params.cite}:`, error);
    res.status(500).json({
      success: false,
      message: `Storage verification failed for ${req.params.cite}`,
      error: error.message
    });
  }
});

module.exports = router;