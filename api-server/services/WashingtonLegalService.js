const fetch = require('node-fetch');
const https = require('https');

class WashingtonLegalService {
  static BASE_URL = 'https://lawdoccitelookup.leg.wa.gov/v1';
  static RCW_BASE_URL = 'https://app.leg.wa.gov/RCW/default.aspx';
  
  // Cache for storing fetched content
  static cache = new Map();
  
  // Create a custom HTTPS agent to handle connection issues
  static httpsAgent = new https.Agent({
    keepAlive: true,
    timeout: 30000,
    maxSockets: 5,
    rejectUnauthorized: true
  });
  
  // Enhanced fetch with retry logic and better headers
  static async fetchWithRetry(url, options = {}, retries = 3) {
    const defaultOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 30000,
      agent: this.httpsAgent,
      ...options
    };
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${retries} to fetch ${url}`);
        
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ Successfully fetched ${url} on attempt ${attempt}`);
        return response;
        
      } catch (error) {
        console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === retries) {
          throw new Error(`Failed to fetch ${url} after ${retries} attempts. Last error: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // Fetch RCW citations from official API
  static async fetchRCWCitations(searchTerm = '') {
    try {
      console.log('📋 Fetching RCW citations from official API...');
      
      const response = await this.fetchWithRetry(`${this.BASE_URL}/rcw`, {
        headers: {
          'User-Agent': 'iMobilize-Legal-Research/1.0',
          'Accept': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log(`📋 Fetched ${data.length} total RCW citations`);
      
      // Filter for protest-related laws
      const protestKeywords = [
        'riot', 'assembly', 'disorderly', 'obstruct', 'permit', 
        'demonstration', 'protest', 'unlawful assembly', 'disturbing',
        'trespass', 'blocking', 'interference', 'civil disorder', 'mischief'
      ];
      
      const filteredData = data.filter(item => 
        protestKeywords.some(keyword => 
          item.cite?.toLowerCase().includes(keyword) || 
          item.title?.toLowerCase().includes(keyword) ||
          item.shortTitle?.toLowerCase().includes(keyword)
        )
      );
      
      console.log(`📋 Found ${filteredData.length} protest-related laws`);
      return filteredData.slice(0, 20);
      
    } catch (error) {
      console.error('❌ Error fetching RCW citations:', error);
      console.log('📋 Using fallback citation data...');
      return this.getFallbackRCWData();
    }
  }
  
  // Scrape specific RCW content with enhanced error handling
  static async fetchRCWContent(cite) {
    try {
      // Check cache first
      if (this.cache.has(cite)) {
        console.log(`Retrieved ${cite} from cache`);
        return this.cache.get(cite);
      }
      
      console.log(`🔍 Scraping content for ${cite}...`);
      
      const citeNumber = cite.replace('RCW ', '').trim();
      const url = `https://app.leg.wa.gov/RCW/default.aspx?cite=${citeNumber}`;
      
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      
      console.log(`📄 Downloaded ${html.length} characters for ${cite}`);
      
      const parsedContent = this.parseRCWHTML(html, cite);
      
      // Cache the result
      this.cache.set(cite, parsedContent);
      console.log(`💾 Cached result for ${cite}`);
      
      return parsedContent;
      
    } catch (error) {
      console.error(`❌ Error fetching RCW content for ${cite}:`, error.message);
      console.log(`📋 Using fallback content for ${cite}...`);
      return this.getFallbackRCWContent(cite);
    }
  }

  // Enhanced HTML parsing with better content extraction
  static parseRCWHTML(html, cite) {
    try {
      console.log(`🔍 Parsing HTML for ${cite} (${html.length} chars)...`);
      
      // Extract title
      let title = this.extractTitle(html, cite);
      console.log(`📝 Extracted title: "${title}"`);
      
      // Extract content using multiple strategies
      let content = this.extractContent(html);
      
      if (!content || content.length < 50) {
        console.log(`⚠️ Content extraction failed for ${cite}, using fallback`);
        return this.getFallbackRCWContent(cite);
      }
      
      console.log(`📝 Extracted content: ${content.substring(0, 100)}...`);
      
      // Determine penalty
      const penalty = this.determinePenalty(title + ' ' + content);
      console.log(`⚖️ Determined penalty: "${penalty}"`);

      const summary = this.generateSmartSummary(content, cite);
      
      return {
        title,
        content,
        penalty,
        summary,
        lastUpdated: new Date().toISOString(),
        source: `https://app.leg.wa.gov/RCW/default.aspx?cite=${cite.replace('RCW ', '').replace(/\s+/g, '')}`
      };
      
    } catch (error) {
      console.error(`❌ Error parsing HTML for ${cite}:`, error);
      return this.getFallbackRCWContent(cite);
    }
  }
  
  // Extract title from HTML
  static extractTitle(html, cite) {
    const titlePatterns = [
      /<title[^>]*>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<h2[^>]*>([^<]+)<\/h2>/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let title = match[1]
          .replace(/RCW \d+\.\d+\.\d+\s*[-–—]?\s*/i, '')
          .replace(/Washington State Legislature/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (title && title.length > 3 && !title.toLowerCase().includes('washington state')) {
          return title;
        }
      }
    }
    
    return 'Legal Section';
  }
  
  // Extract main content from HTML
  static extractContent(html) {
    // Clean HTML first
    const cleanText = this.cleanHTMLText(html);
    
    // Look for content between "PDFRCW" and "Legislative questions"
    const cleanPattern = /PDFRCW\s+[\d.]+([^]*?)(?=Legislative questions|Studies, audits|Accessibility|$)/i;
    const cleanMatch = cleanText.match(cleanPattern);
    
    if (cleanMatch && cleanMatch[1]) {
      let content = cleanMatch[1].trim();
      
      // Remove navigation breadcrumbs and cleanup
      content = content.replace(/^.*?Beginning of Chapter.*?>/i, '');
      content = content.replace(/^.*?Print RCWs.*?>/i, '');
      content = content.replace(/^\s*Criminal mischief\./, 'Criminal mischief.');
      content = content.replace(/\[.*?\]\s*$/g, ''); // Remove citations at end
      content = content.replace(/NOTES:.*$/is, ''); // Remove notes section
      content = content.replace(/Effective date.*$/is, ''); // Remove effective date
      content = content.trim();
      
      if (content.length > 50 && this.isValidLegalContent(content)) {
        return content;
      }
    }
    
    // Look specifically for the legal definition starting with "(1)"
    const definitionPattern = /\(\d+\)\s*A person is guilty[^]*?(?=Legislative questions|Studies, audits|Accessibility|\[|$)/i;
    const defMatch = cleanText.match(definitionPattern);
    
    if (defMatch && defMatch[0]) {
      let content = defMatch[0].trim();
      content = content.replace(/\[.*?\]\s*$/g, ''); // Remove citations
      content = content.replace(/NOTES:.*$/is, ''); // Remove notes
      
      if (content.length > 50) {
        return content;
      }
    }
    
    // Strategy 3: Fallback - look for any legal content patterns
    const legalPatterns = [
      /Criminal mischief\.\s*\(\d+\)[^]*?(?=Legislative questions|Studies, audits|Accessibility|\[|$)/i,
      /A person is guilty[^]*?(?=Legislative questions|Studies, audits|Accessibility|\[|$)/i,
      /(?:It is unlawful|No person|The following)[^]*?(?=Legislative questions|Studies, audits|Accessibility|\[|$)/i
    ];
    
    for (const pattern of legalPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0] && match[0].length > 50) {
        let content = match[0].trim();
        content = content.replace(/\[.*?\]\s*$/g, '');
        return content;
      }
    }
    
    return '';
  }
  
  // Helper to validate if content looks like actual legal text
  static isValidLegalContent(content) {
    const legalIndicators = [
      'person is guilty',
      'misdemeanor',
      'felony',
      'unlawful',
      'prohibited',
      'violation',
      'offense'
    ];
    
    const lowerContent = content.toLowerCase();
    const hasLegalLanguage = legalIndicators.some(indicator => lowerContent.includes(indicator));
    
    // Should not be mostly navigation
    const navigationWords = ['menu', 'search', 'bills', 'meetings', 'session', 'legislators'];
    const navWordCount = navigationWords.filter(word => lowerContent.includes(word)).length;
    const isNotNavigation = navWordCount < 3;
    
    return hasLegalLanguage && isNotNavigation;
  }
  
  // Determine penalty from content
  static determinePenalty(fullText) {
    const lowerText = fullText.toLowerCase();
    
    const penaltyPatterns = [
      { pattern: /class c felony/i, penalty: 'Class C felony' },
      { pattern: /class b felony/i, penalty: 'Class B felony' },
      { pattern: /class a felony/i, penalty: 'Class A felony' },
      { pattern: /gross misdemeanor/i, penalty: 'Gross misdemeanor' },
      { pattern: /misdemeanor/i, penalty: 'Misdemeanor' },
      { pattern: /traffic infraction/i, penalty: 'Traffic infraction' },
      { pattern: /infraction/i, penalty: 'Infraction' }
    ];
    
    for (const { pattern, penalty } of penaltyPatterns) {
      if (pattern.test(lowerText)) {
        return penalty;
      }
    }
    
    return 'Varies';
  }
  
  // HTML cleaning
  static cleanHTMLText(html) {
    if (!html) return '';
    
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
  
  // Generate intelligent summaries
  static generateSmartSummary(content, cite) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('criminal mischief') || cite.includes('9A.84.010')) {
      return 'Criminal mischief involves coordinated unlawful force by 4+ people. Can be a gross misdemeanor or Class C felony if armed. Important to understand group dynamics in protests.';
    }
    
    if (lowerContent.includes('riot') && (lowerContent.includes('five') || lowerContent.includes('four'))) {
      return 'Defines riot as coordinated unlawful force by multiple people. Important for protesters to understand group dynamics and legal boundaries.';
    }
    
    if (lowerContent.includes('disperse') && lowerContent.includes('peace officer')) {
      return 'Requires dispersal when ordered by police if in groups. Know your rights but understand legal obligations when police issue lawful dispersal orders.';
    }
    
    if (lowerContent.includes('traffic') && lowerContent.includes('pedestrian')) {
      return 'Blocking traffic can result in citations. Plan protest routes on sidewalks or obtain proper permits for street demonstrations.';
    }
    
    if (lowerContent.includes('trespass')) {
      return 'Trespassing laws may apply to protests on private property. Understand property boundaries and obtain permission when necessary.';
    }
    
    return 'This law may impact protest activities. Understanding these legal boundaries helps ensure your demonstrations remain within legal limits.';
  }
  
  // Fallback data when APIs fail
  static getFallbackRCWData() {
    return [
      { cite: 'RCW 9A.84.010', title: 'Criminal mischief', shortTitle: 'Criminal mischief definition' },
      { cite: 'RCW 9A.84.020', title: 'Failure to disperse', shortTitle: 'Dispersal requirements' },
      { cite: 'RCW 46.61.250', title: 'Pedestrians on roadways', shortTitle: 'Traffic blocking' },
      { cite: 'RCW 9A.84.030', title: 'Disorderly conduct', shortTitle: 'Disorderly conduct' },
      { cite: 'RCW 9A.52.070', title: 'Criminal trespass in the first degree', shortTitle: 'Trespassing' }
    ];
  }
  
  // Fallback data
  static getFallbackRCWContent(cite) {
    const fallbackContent = {
      'RCW 9A.84.010': {
        title: 'Criminal mischief',
        content: '(1) A person is guilty of the crime of criminal mischief if, acting with three or more other persons, he or she knowingly and unlawfully uses or threatens to use force, or in any way participates in the use of such force, against any other person or against property. (2)(a) Except as provided in (b) of this subsection, the crime of criminal mischief is a gross misdemeanor. (b) The crime of criminal mischief is a class C felony if the actor is armed with a deadly weapon.',
        penalty: 'Gross misdemeanor (Class C felony if armed)',
        summary: 'Criminal mischief involves coordinated unlawful force by 4+ people. Can be a gross misdemeanor or Class C felony if armed. Important to understand group dynamics in protests.'
      },
      'RCW 9A.84.020': {
        title: 'Failure to disperse',
        content: 'A person is guilty of failure to disperse if he or she congregates with a group of four or more other persons and in connection with and as a part of the group refuses or fails to disperse when ordered to do so by a peace officer.',
        penalty: 'Misdemeanor',
        summary: 'Requires dispersal when ordered by police if in groups of 5+. Know your rights but understand legal obligations when police issue lawful dispersal orders.'
      },
      'RCW 46.61.250': {
        title: 'Pedestrians on roadways',
        content: 'No pedestrian shall unnecessarily stop or delay traffic while upon the part of a highway intended for vehicular traffic.',
        penalty: 'Traffic infraction',
        summary: 'Blocking traffic can result in citations. Plan protest routes on sidewalks or obtain proper permits for street demonstrations.'
      }
    };
    
    return fallbackContent[cite] || {
      title: 'Legal Section',
      content: 'Content temporarily unavailable. Please check the official source.',
      penalty: 'Varies',
      summary: 'This legal section may impact protest activities. Consult official sources for current information.'
    };
  }
  
  // Clear cache
  static clearCache() {
    this.cache.clear();
    console.log('💾 Legal content cache cleared');
  }
  
  // Get cache statistics
  static getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = { WashingtonLegalService };