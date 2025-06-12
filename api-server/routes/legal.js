const express = require('express');
const { LegalDataManager } = require('../services/LegalDataManager');
const { WashingtonLegalService } = require('../services/WashingtonLegalService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get legal data (public endpoint)
router.get('/data', async (req, res) => {
  try {
    console.log('📊 Fetching legal data...');
    const cachedData = await LegalDataManager.getCachedData();
    const updateStatus = await LegalDataManager.getUpdateStatus();
    
    console.log(`✅ Returning ${cachedData.length} legal documents`);
    
    res.json({
      success: true,
      data: {
        laws: cachedData,
        lastUpdate: updateStatus.lastUpdate,
        needsUpdate: updateStatus.needsUpdate,
        count: cachedData.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching legal data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch legal data',
      error: 'FETCH_ERROR',
      details: error.message
    });
  }
});

// Get legal data (public endpoint)
router.get('/data/jurisdiction', async (req, res) => {
  try {
    console.log('📊 Fetching legal data...');
    const stateData = await LegalDataManager.searchLegalDocuments(jurisdiction + " State", {jurisdiction:true});
    
    console.log(`✅ Returning ${stateData.length} legal documents`);
    
    res.json({
      success: true,
      data: {
        laws: stateData,
        lastUpdate: updateStatus.lastUpdate,
        needsUpdate: updateStatus.needsUpdate,
        count: stateData.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching legal data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch legal data',
      error: 'FETCH_ERROR',
      details: error.message
    });
  }
});

// Force update legal data (protected endpoint)
router.post('/update', verifyToken, async (req, res) => {
  try {
    console.log('🔄 Starting force update of legal data...');
    const result = await LegalDataManager.forceUpdate();
    
    console.log(`✅ Update completed - Success: ${result.success}, Content: ${result.rcwContent.length}, Errors: ${result.errors.length}`);
    
    res.json({
      success: result.success,
      message: result.success ? 'Legal data updated successfully' : 'Update completed with errors',
      data: {
        contentCount: result.rcwContent.length,
        citationCount: result.rcwCitations.length,
        errors: result.errors,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('❌ Error updating legal data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update legal data',
      error: 'UPDATE_ERROR',
      details: error.message
    });
  }
});

// Get update status
router.get('/status', async (req, res) => {
  try {
    const status = await LegalDataManager.getUpdateStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Error fetching update status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch update status',
      error: 'STATUS_ERROR',
      details: error.message
    });
  }
});

// Test individual service components
router.get('/test/citations', async (req, res) => {
  try {
    console.log('🧪 Testing RCW citations fetch...');
    
    const citations = await WashingtonLegalService.fetchRCWCitations();
    
    res.json({
      success: true,
      message: 'Citations test successful',
      data: {
        count: citations.length,
        sample: citations.slice(0, 3),
        cacheStats: WashingtonLegalService.getCacheStats()
      }
    });
  } catch (error) {
    console.error('❌ Citations test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Citations test failed',
      error: 'CITATIONS_TEST_ERROR',
      details: error.message
    });
  }
});

router.get('/test/content/:cite', async (req, res) => {
  try {
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
      error: 'CONTENT_TEST_ERROR',
      details: error.message
    });
  }
});

// Debug endpoint to see raw parsing data
router.get('/debug/content/:cite', async (req, res) => {
  try {
    const cite = req.params.cite;
    console.log(`🔍 Debug parsing for ${cite}...`);
    
    const { WashingtonLegalService } = require('../services/WashingtonLegalService');
    
    // Clear cache to get fresh data
    WashingtonLegalService.clearCache();
    
    // Get the raw HTML
    const citeNumber = cite.replace('RCW ', '');
    const url = `https://app.leg.wa.gov/RCW/default.aspx?cite=${citeNumber}`;
    
    const fetch = require('node-fetch');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'iMobilize-Legal-Research/1.0',
        'Accept': 'text/html',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse with detailed debugging
    const debugResult = WashingtonLegalService.debugParseRCWHTML(html, cite);
    
    // Return structured debug information
    res.json({
      success: true,
      cite: cite,
      url: url,
      debug: debugResult,
      instructions: {
        message: "This endpoint shows detailed parsing information",
        fields: {
          htmlLength: "Size of downloaded HTML",
          extractedTitle: "Title found in HTML",
          titlePatterns: "Which patterns were tried for title extraction",
          contentAttempts: "Different content extraction attempts",
          finalContent: "The content that was ultimately selected",
          cleanedContent: "Content after navigation removal",
          penalty: "Detected penalty type",
          allText: "First 2000 characters of all text (for manual inspection)"
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Debug parsing failed for ${req.params.cite}:`, error);
    res.status(500).json({
      success: false,
      message: `Debug parsing failed for ${req.params.cite}`,
      error: error.message
    });
  }
});

module.exports = router;