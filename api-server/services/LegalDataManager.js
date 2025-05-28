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
  
  // Update all legal data
  static async updateAllData() {
    const results = {
      success: false,
      rcwCitations: [],
      rcwContent: [],
      recentBills: [],
      errors: [],
      timestamp: new Date().toISOString()
    };
    
    try {
      const pool = getPostgreSQLPool();
      const mongoDb = getMongoDatabase();
      
      // Step 1: Get RCW citations
      console.log('Fetching RCW citations...');
      try {
        results.rcwCitations = await WashingtonLegalService.fetchRCWCitations();
        console.log(`Updated ${results.rcwCitations.length} RCW citations`);
      } catch (error) {
        results.errors.push(`RCW Citations: ${error.message}`);
      }
      
      // Step 2: Get detailed content for key laws
      console.log('Fetching detailed law content...');
      const keyLaws = [
        'RCW 9A.84.010', // Riot
        'RCW 9A.84.020', // Failure to disperse
        'RCW 46.61.250', // Pedestrians on roadways
        'RCW 9A.84.030', // Disorderly conduct
        'RCW 9A.52.070', // Criminal trespass
        'RCW 9A.76.020', // Obstructing a law enforcement officer
        'RCW 46.61.015'  // Obstructing traffic
      ];
      
      for (const cite of keyLaws) {
        try {
          const content = await WashingtonLegalService.fetchRCWContent(cite);
          if (content) {
            results.rcwContent.push({ cite, ...content });
          }
          
          // Small delay to be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          results.errors.push(`${cite}: ${error.message}`);
        }
      }
      
      // Step 3: Save to databases
      console.log('Saving legal data to databases...');
      
      // Save RCW content to PostgreSQL
      for (const rcw of results.rcwContent) {
        await pool.query(`
          INSERT INTO legal_documents (cite, title, content, penalty, summary, source_url, last_updated)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (cite) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            penalty = EXCLUDED.penalty,
            summary = EXCLUDED.summary,
            source_url = EXCLUDED.source_url,
            last_updated = EXCLUDED.last_updated
        `, [rcw.cite, rcw.title, rcw.content, rcw.penalty, rcw.summary, rcw.source, rcw.lastUpdated]);
      }
      
      // Save metadata to MongoDB
      await mongoDb.collection('legal_data_cache').insertOne({
        type: 'rcw_update',
        citations: results.rcwCitations,
        content_count: results.rcwContent.length,
        errors: results.errors,
        timestamp: new Date(),
        version: '1.0'
      });
      
      // Record update timestamp
      await pool.query(
        'INSERT INTO legal_data_updates (update_type, status, details, last_updated) VALUES ($1, $2, $3, $4)',
        ['rcw_content', 'success', JSON.stringify({ errors: results.errors, count: results.rcwContent.length }), new Date()]
      );
      
      results.success = true;
      console.log('Legal data update completed successfully');
      
    } catch (error) {
      results.errors.push(`Update process: ${error.message}`);
      console.error('Legal data update failed:', error);
    }
    
    return results;
  }
  
  // Get cached legal data
  static async getCachedData() {
    try {
      const pool = getPostgreSQLPool();
      const result = await pool.query(`
        SELECT cite, title, content, penalty, summary, source_url, last_updated
        FROM legal_documents
        ORDER BY cite
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching cached legal data:', error);
      return [];
    }
  }
  
  // Force update
  static async forceUpdate() {
    console.log('Forcing legal data update...');
    WashingtonLegalService.clearCache();
    return await this.updateAllData();
  }
  
  // Get update status
  static async getUpdateStatus() {
    try {
      const pool = getPostgreSQLPool();
      const result = await pool.query(`
        SELECT update_type, status, details, last_updated
        FROM legal_data_updates
        ORDER BY last_updated DESC
        LIMIT 1
      `);
      
      if (result.rows.length === 0) {
        return {
          lastUpdate: null,
          needsUpdate: true,
          status: 'never_updated'
        };
      }
      
      const lastUpdate = result.rows[0];
      const needsUpdate = await this.shouldUpdate();
      
      return {
        lastUpdate: lastUpdate.last_updated,
        needsUpdate,
        status: lastUpdate.status,
        details: lastUpdate.details
      };
    } catch (error) {
      return {
        lastUpdate: null,
        needsUpdate: true,
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = { LegalDataManager };