const { getPostgreSQLPool, getMongoDatabase } = require('../config/database');
const { WashingtonLegalService } = require('./WashingtonLegalService');

class LegalDataManager {
  static UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  // Check if data needs updating
  static async shouldUpdate() {
    try {
      const pool = getPostgreSQLPool();
      const result = await pool.query(
        'SELECT last_updated FROM legal_data_updates ORDER BY last_updated DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) return true;
      
      const lastUpdate = new Date(result.rows[0].last_updated);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdate.getTime();
      
      return timeDiff > this.UPDATE_INTERVAL;
    } catch (error) {
      console.error('Error checking update status:', error);
      return true; // Update if we can't determine last update
    }
  }
  
  // Get list of important protest-related RCWs to prioritize
  static getImportantRCWs() {
    return [
      'RCW 9A.84.010', // Riot
      'RCW 9A.84.020', // Failure to disperse
      'RCW 9A.84.030', // Disorderly conduct
      'RCW 46.61.250', // Pedestrians on roadways
      'RCW 9A.52.070', // Criminal trespass
      'RCW 9A.76.020', // Obstructing a law enforcement officer
      'RCW 46.61.015', // Obstructing traffic
      'RCW 9A.48.020', // Arson in the second degree
      'RCW 9A.52.080', // Criminal trespass in the second degree
      'RCW 9.41.270',  // Weapons at demonstrations
      'RCW 42.17A.555' // Political advertising near polling places
    ];
  }
  
  // Update all legal data with improved error handling
  static async updateAllData() {
    const startTime = Date.now();
    const results = {
      success: false,
      rcwCitations: [],
      rcwContent: [],
      errors: [],
      timestamp: new Date().toISOString(),
      duration: 0,
      recordsUpdated: 0
    };
    
    try {
      const pool = getPostgreSQLPool();
      const mongoDb = getMongoDatabase();
      
      console.log('🚀 Starting comprehensive legal data update...');
      
      // Step 1: Get RCW citations from official API
      console.log('📋 Step 1: Fetching RCW citations...');
      try {
        results.rcwCitations = await WashingtonLegalService.fetchRCWCitations();
        console.log(`✅ Retrieved ${results.rcwCitations.length} RCW citations`);
        
        // Save citations to database
        for (const citation of results.rcwCitations) {
          await pool.query(`
            INSERT INTO legal_citations (cite, title, short_title, is_protest_related, fetched_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (cite) DO UPDATE SET
              title = EXCLUDED.title,
              short_title = EXCLUDED.short_title,
              is_protest_related = EXCLUDED.is_protest_related,
              fetched_at = EXCLUDED.fetched_at
          `, [
            citation.cite, 
            citation.title || citation.shortTitle, 
            citation.shortTitle, 
            true
          ]);
        }
        
      } catch (error) {
        results.errors.push(`RCW Citations: ${error.message}`);
        console.error('❌ Citations fetch failed:', error.message);
      }
      
      // Step 2: Get detailed content for important laws
      console.log('📄 Step 2: Fetching detailed law content...');
      const importantRCWs = this.getImportantRCWs();
      
      // Add any additional RCWs from the citations that we don't already have
      const additionalRCWs = results.rcwCitations
        .map(c => c.cite)
        .filter(cite => !importantRCWs.includes(cite))
        .slice(0, 10); // Limit to top 10 additional
      
      const allRCWsToFetch = [...importantRCWs, ...additionalRCWs];
      
      console.log(`📄 Fetching content for ${allRCWsToFetch.length} RCWs...`);
      
      // Use batch fetching with rate limiting
      const batchResults = await WashingtonLegalService.batchFetchRCWContent(
        allRCWsToFetch, 
        1500 // 1.5 second delay between requests
      );
      
      // Process batch results
      for (const result of batchResults) {
        if (result.success && result.content) {
          results.rcwContent.push({
            cite: result.cite,
            ...result.content
          });
        } else {
          results.errors.push(`${result.cite}: ${result.error || 'Content extraction failed'}`);
        }
      }
      
      console.log(`✅ Successfully processed ${results.rcwContent.length} RCW contents`);
      
      // Step 3: Save detailed content to PostgreSQL
      console.log('💾 Step 3: Saving content to database...');
      
      for (const rcw of results.rcwContent) {
        try {
          await pool.query(`
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
          `, [
            rcw.cite, 
            rcw.title, 
            rcw.content, 
            rcw.penalty, 
            rcw.summary, 
            rcw.source,
            'protest-related',
            'Washington State'
          ]);
          
          results.recordsUpdated++;
          
        } catch (error) {
          results.errors.push(`Database save for ${rcw.cite}: ${error.message}`);
          console.error(`❌ Failed to save ${rcw.cite}:`, error.message);
        }
      }
      
      // Step 4: Save metadata to MongoDB
      console.log('📊 Step 4: Saving metadata to MongoDB...');
      try {
        await mongoDb.collection('legal_data_cache').insertOne({
          type: 'rcw_update',
          citations_count: results.rcwCitations.length,
          content_count: results.rcwContent.length,
          errors_count: results.errors.length,
          errors: results.errors,
          important_rcws: importantRCWs,
          timestamp: new Date(),
          version: '2.0',
          cache_stats: WashingtonLegalService.getCacheStats()
        });
        
        console.log('✅ Metadata saved to MongoDB');
        
      } catch (error) {
        results.errors.push(`MongoDB save: ${error.message}`);
        console.error('❌ MongoDB save failed:', error.message);
      }
      
      // Step 5: Record update status
      results.duration = Date.now() - startTime;
      
      await pool.query(`
        INSERT INTO legal_data_updates (
          update_type, status, details, records_updated, 
          errors_encountered, duration_ms, last_updated
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        'rcw_content', 
        results.errors.length === 0 ? 'success' : 'partial',
        JSON.stringify({ 
          errors: results.errors, 
          citations_count: results.rcwCitations.length,
          content_count: results.rcwContent.length 
        }),
        results.recordsUpdated,
        results.errors.length,
        results.duration
      ]);
      
      results.success = results.rcwContent.length > 0;
      
      if (results.success) {
        console.log(`🎉 Legal data update completed successfully in ${results.duration}ms`);
        console.log(`📊 Updated ${results.recordsUpdated} records with ${results.errors.length} errors`);
      } else {
        console.log(`⚠️ Legal data update completed with issues: ${results.errors.length} errors`);
      }
      
    } catch (error) {
      results.errors.push(`Update process: ${error.message}`);
      results.duration = Date.now() - startTime;
      console.error('💥 Legal data update failed:', error);
      
      // Still record the failed attempt
      try {
        const pool = getPostgreSQLPool();
        await pool.query(`
          INSERT INTO legal_data_updates (
            update_type, status, details, records_updated, 
            errors_encountered, duration_ms, last_updated
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
          'rcw_content', 
          'error',
          JSON.stringify({ error: error.message, errors: results.errors }),
          0,
          results.errors.length,
          results.duration
        ]);
      } catch (dbError) {
        console.error('Failed to record error status:', dbError);
      }
    }
    
    return results;
  }
  
  // Get cached legal data with filtering and search
  static async getCachedData(filters = {}) {
    try {
      const pool = getPostgreSQLPool();
      
      let query = `
        SELECT 
          id, cite, title, content, penalty, summary, source_url, 
          category, jurisdiction, last_updated, created_at
        FROM legal_documents
      `;
      
      const conditions = [];
      const params = [];
      let paramCount = 1;
      
      // Add filters
      if (filters.category) {
        conditions.push(`category = $${paramCount}`);
        params.push(filters.category);
        paramCount++;
      }
      
      if (filters.search) {
        conditions.push(`(
          title ILIKE $${paramCount} OR 
          content ILIKE $${paramCount} OR 
          summary ILIKE $${paramCount} OR
          cite ILIKE $${paramCount}
        )`);
        params.push(`%${filters.search}%`);
        paramCount++;
      }
      
      if (filters.penalty) {
        conditions.push(`penalty ILIKE $${paramCount}`);
        params.push(`%${filters.penalty}%`);
        paramCount++;
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY 
        CASE 
          WHEN cite LIKE 'RCW 9A.84%' THEN 1  -- Riot, disperse, disorderly
          WHEN cite LIKE 'RCW 46.61%' THEN 2  -- Traffic laws
          WHEN cite LIKE 'RCW 9A.52%' THEN 3  -- Trespass
          WHEN cite LIKE 'RCW 9A.76%' THEN 4  -- Obstruction
          ELSE 5
        END, cite`;
      
      const result = await pool.query(query, params);
      
      console.log(`📋 Retrieved ${result.rows.length} legal documents from cache`);
      return result.rows;
      
    } catch (error) {
      console.error('Error fetching cached legal data:', error);
      return [];
    }
  }
  
  // Get legal data by specific cite
  static async getLegalDataByCite(cite) {
    try {
      const pool = getPostgreSQLPool();
      const result = await pool.query(
        'SELECT * FROM legal_documents WHERE cite = $1',
        [cite]
      );
      
      if (result.rows.length === 0) {
        // Try to fetch it if not in cache
        console.log(`📄 ${cite} not in cache, attempting to fetch...`);
        const content = await WashingtonLegalService.fetchRCWContent(cite);
        
        if (content) {
          // Save to database
          await pool.query(`
            INSERT INTO legal_documents (
              cite, title, content, penalty, summary, source_url, 
              category, jurisdiction, last_updated, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            cite, content.title, content.content, content.penalty, 
            content.summary, content.source, 'protest-related', 'Washington State'
          ]);
          
          return content;
        }
        
        return null;
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error(`Error fetching legal data for ${cite}:`, error);
      return null;
    }
  }
  
  // Force update with progress reporting
  static async forceUpdate(progressCallback = null) {
    console.log('🔄 Forcing legal data update...');
    WashingtonLegalService.clearCache();
    
    if (progressCallback) {
      progressCallback({ stage: 'starting', progress: 0 });
    }
    
    try {
      const result = await this.updateAllData();
      
      if (progressCallback) {
        progressCallback({ 
          stage: 'completed', 
          progress: 100, 
          result 
        });
      }
      
      return result;
      
    } catch (error) {
      if (progressCallback) {
        progressCallback({ 
          stage: 'error', 
          progress: 0, 
          error: error.message 
        });
      }
      throw error;
    }
  }
  
  // Get comprehensive update status
  static async getUpdateStatus() {
    try {
      const pool = getPostgreSQLPool();
      
      // Get latest update info
      const updateResult = await pool.query(`
        SELECT update_type, status, details, records_updated, 
               errors_encountered, duration_ms, last_updated
        FROM legal_data_updates
        ORDER BY last_updated DESC
        LIMIT 1
      `);
      
      // Get document counts
      const countResult = await pool.query(`
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN category = 'protest-related' THEN 1 END) as protest_related,
          MAX(last_updated) as latest_content_update
        FROM legal_documents
      `);
      
      // Get citation counts
      const citationResult = await pool.query(`
        SELECT COUNT(*) as total_citations
        FROM legal_citations
        WHERE is_protest_related = true
      `);
      
      if (updateResult.rows.length === 0) {
        return {
          lastUpdate: null,
          needsUpdate: true,
          status: 'never_updated',
          documentCount: parseInt(countResult.rows[0].total_documents) || 0,
          protestRelatedCount: parseInt(countResult.rows[0].protest_related) || 0,
          citationCount: parseInt(citationResult.rows[0].total_citations) || 0
        };
      }
      
      const lastUpdate = updateResult.rows[0];
      const needsUpdate = await this.shouldUpdate();
      
      return {
        lastUpdate: lastUpdate.last_updated,
        needsUpdate,
        status: lastUpdate.status,
        details: lastUpdate.details,
        recordsUpdated: lastUpdate.records_updated,
        errorsEncountered: lastUpdate.errors_encountered,
        durationMs: lastUpdate.duration_ms,
        documentCount: parseInt(countResult.rows[0].total_documents) || 0,
        protestRelatedCount: parseInt(countResult.rows[0].protest_related) || 0,
        citationCount: parseInt(citationResult.rows[0].total_citations) || 0,
        latestContentUpdate: countResult.rows[0].latest_content_update
      };
      
    } catch (error) {
      return {
        lastUpdate: null,
        needsUpdate: true,
        status: 'error',
        error: error.message,
        documentCount: 0,
        protestRelatedCount: 0,
        citationCount: 0
      };
    }
  }
  
  // Search legal documents with advanced options
  static async searchLegalDocuments(searchTerm, options = {}) {
    try {
      const pool = getPostgreSQLPool();
      
      const {
        category = 'protest-related',
        penalty = null,
        limit = 20,
        offset = 0
      } = options;
      
      let query = `
        SELECT 
          cite, title, penalty, summary, source_url, last_updated,
          ts_rank(to_tsvector('english', title || ' ' || content || ' ' || summary), 
                  plainto_tsquery('english', $1)) as relevance
        FROM legal_documents
        WHERE to_tsvector('english', title || ' ' || content || ' ' || summary) 
              @@ plainto_tsquery('english', $1)
      `;
      
      const params = [searchTerm];
      let paramCount = 2;
      
      if (category) {
        query += ` AND category = $${paramCount}`;
        params.push(category);
        paramCount++;
      }
      
      if (penalty) {
        query += ` AND penalty ILIKE $${paramCount}`;
        params.push(`%${penalty}%`);
        paramCount++;
      }
      
      query += ` ORDER BY relevance DESC, cite LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      return {
        results: result.rows,
        total: result.rows.length,
        searchTerm,
        options
      };
      
    } catch (error) {
      console.error('Error searching legal documents:', error);
      return {
        results: [],
        total: 0,
        searchTerm,
        error: error.message
      };
    }
  }
  
  // Initialize legal data system
  static async initialize() {
    try {
      console.log('🚀 Initializing Legal Data Manager...');
      
      const status = await this.getUpdateStatus();
      
      if (status.needsUpdate || status.documentCount === 0) {
        console.log('📄 No legal data found or update needed, starting initial fetch...');
        await this.updateAllData();
      } else {
        console.log(`✅ Legal data is current (${status.documentCount} documents)`);
      }
      
      console.log('🎉 Legal Data Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Legal Data Manager:', error);
      throw error;
    }
  }
}

module.exports = { LegalDataManager };