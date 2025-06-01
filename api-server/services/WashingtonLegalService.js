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
      
      // Filter for protest-related laws with expanded keywords
      const protestKeywords = [
        'riot', 'assembly', 'disorderly', 'obstruct', 'permit', 
        'demonstration', 'protest', 'unlawful assembly', 'disturbing',
        'trespass', 'blocking', 'interference', 'civil disorder', 'mischief',
        'failure to disperse', 'pedestrian', 'traffic', 'public', 'disturbance',
        'criminal mischief', 'breach', 'peace', 'gathering', 'crowd'
      ];
      
      const filteredData = data.filter(item => 
        protestKeywords.some(keyword => 
          item.cite?.toLowerCase().includes(keyword) || 
          item.title?.toLowerCase().includes(keyword) ||
          item.shortTitle?.toLowerCase().includes(keyword)
        )
      );
      
      console.log(`📋 Found ${filteredData.length} protest-related laws`);
      
      // Add known important RCWs that might not match keyword search
      const importantRCWs = [
        'RCW 9A.84.010', 'RCW 9A.84.020', 'RCW 9A.84.030', 
        'RCW 46.61.250', 'RCW 9A.52.070', 'RCW 9A.76.020',
        'RCW 46.61.015', 'RCW 9A.48.020'
      ];
      
      const additionalRCWs = data.filter(item => 
        importantRCWs.includes(item.cite) && 
        !filteredData.some(existing => existing.cite === item.cite)
      );
      
      const combinedResults = [...filteredData, ...additionalRCWs];
      console.log(`📋 Total relevant laws: ${combinedResults.length}`);
      
      return combinedResults.slice(0, 30); // Return top 30 results
      
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
        console.log(`📦 Retrieved ${cite} from cache`);
        return this.cache.get(cite);
      }
      
      console.log(`🔍 Scraping content for ${cite}...`);
      
      const citeNumber = cite.replace('RCW ', '').trim();
      const url = `https://app.leg.wa.gov/RCW/default.aspx?cite=${citeNumber}`;
      
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      
      console.log(`📄 Downloaded ${html.length} characters for ${cite}`);
      
      const parsedContent = this.parseRCWHTML(html, cite);
      
      if (!parsedContent || !parsedContent.content || parsedContent.content.length < 50) {
        console.log(`⚠️ Parsed content too short for ${cite}, using fallback`);
        return this.getFallbackRCWContent(cite);
      }
      
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

  // Enhanced HTML parsing with multiple strategies
  static parseRCWHTML(html, cite) {
    try {
      console.log(`🔍 Parsing HTML for ${cite} (${html.length} chars)...`);
      
      // Extract title using multiple patterns
      let title = this.extractTitle(html, cite);
      console.log(`📝 Extracted title: "${title}"`);
      
      // Extract content using multiple strategies
      let content = this.extractContentMultiStrategy(html);
      
      if (!content || content.length < 50) {
        console.log(`⚠️ Content extraction failed for ${cite}, using fallback`);
        return this.getFallbackRCWContent(cite);
      }
      
      console.log(`📝 Extracted content: ${content.substring(0, 150)}...`);
      
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
  
  // Enhanced content extraction with multiple strategies
  static extractContentMultiStrategy(html) {
    const strategies = [
      () => this.extractContentStrategy1(html), // Original strategy
      () => this.extractContentStrategy2(html), // New improved strategy
      () => this.extractContentStrategy3(html), // Fallback strategy
    ];
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        const content = strategies[i]();
        if (content && content.length > 50 && this.isValidLegalContent(content)) {
          console.log(`✅ Strategy ${i + 1} succeeded for content extraction`);
          return content;
        }
      } catch (error) {
        console.log(`❌ Strategy ${i + 1} failed:`, error.message);
        continue;
      }
    }
    
    return '';
  }
  
  // Strategy 1: Look for content between markers
  static extractContentStrategy1(html) {
    const cleanText = this.cleanHTMLText(html);
    
    // Look for content after "PDFRCW" or similar markers
    const patterns = [
      /PDFRCW\s+[\d.]+\s*([^]*?)(?=Legislative questions|Studies, audits|Accessibility|$)/i,
      /RCW\s+[\d.]+\s*([^]*?)(?=Legislative questions|Studies, audits|Accessibility|$)/i,
      /^\s*[\d.]+\.\s*([^]*?)(?=Legislative questions|Studies, audits|Accessibility|$)/im
    ];
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        let content = match[1].trim();
        content = this.cleanExtractedContent(content);
        if (content.length > 50) {
          return content;
        }
      }
    }
    
    return '';
  }
  
  // Strategy 2: Look for legal definition patterns
  static extractContentStrategy2(html) {
    const cleanText = this.cleanHTMLText(html);
    
    // Look for patterns that start legal definitions
    const legalPatterns = [
      /\(\d+\)\s*A person is guilty[^]*?(?=\(\d+\)|Legislative questions|Studies, audits|Accessibility|$)/i,
      /\(\d+\)\s*It is unlawful[^]*?(?=\(\d+\)|Legislative questions|Studies, audits|Accessibility|$)/i,
      /\(\d+\)\s*No person[^]*?(?=\(\d+\)|Legislative questions|Studies, audits|Accessibility|$)/i,
      /\(\d+\)\s*The following[^]*?(?=\(\d+\)|Legislative questions|Studies, audits|Accessibility|$)/i,
      /\(\d+\)\s*Any person[^]*?(?=\(\d+\)|Legislative questions|Studies, audits|Accessibility|$)/i
    ];
    
    for (const pattern of legalPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0]) {
        let content = match[0].trim();
        content = this.cleanExtractedContent(content);
        if (content.length > 50) {
          return content;
        }
      }
    }
    
    return '';
  }
  
  // Strategy 3: General text extraction fallback
  static extractContentStrategy3(html) {
    const cleanText = this.cleanHTMLText(html);
    
    // Look for any substantial paragraph that contains legal keywords
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    let content = '';
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (this.containsLegalKeywords(lowerSentence) && sentence.length > 30) {
        content += sentence.trim() + '. ';
        if (content.length > 100) break; // Get enough content
      }
    }
    
    return this.cleanExtractedContent(content.trim());
  }
  
  // Clean extracted content
  static cleanExtractedContent(content) {
    return content
      .replace(/^.*?Beginning of Chapter.*?>/i, '')
      .replace(/^.*?Print RCWs.*?>/i, '')
      .replace(/\[.*?\]\s*$/g, '') // Remove citations at end
      .replace(/NOTES:.*$/is, '') // Remove notes section
      .replace(/Effective date.*$/is, '') // Remove effective date
      .replace(/Legislative questions.*$/is, '') // Remove footer
      .replace(/Studies, audits.*$/is, '') // Remove footer
      .replace(/Accessibility.*$/is, '') // Remove footer
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  // Check if text contains legal keywords
  static containsLegalKeywords(text) {
    const legalKeywords = [
      'guilty', 'unlawful', 'misdemeanor', 'felony', 'violation', 
      'offense', 'prohibited', 'person', 'shall', 'crime', 'penalty',
      'punishable', 'fine', 'imprisonment', 'class', 'degree'
    ];
    
    return legalKeywords.some(keyword => text.includes(keyword));
  }
  
  // Extract title from HTML with multiple patterns
  static extractTitle(html, cite) {
    const titlePatterns = [
      /<title[^>]*>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<h2[^>]*>([^<]+)<\/h2>/i,
      /RCW\s+[\d.]+\s*[-–—]?\s*([^<\n\r]+)/i
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
    
    // Fallback based on cite
    const citeMap = {
      'RCW 9A.84.010': 'Riot',
      'RCW 9A.84.020': 'Failure to disperse',
      'RCW 9A.84.030': 'Disorderly conduct',
      'RCW 46.61.250': 'Pedestrians on roadways',
      'RCW 9A.52.070': 'Criminal trespass in the first degree'
    };
    
    return citeMap[cite] || 'Legal Section';
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
      'offense',
      'crime',
      'penalty'
    ];
    
    const lowerContent = content.toLowerCase();
    const hasLegalLanguage = legalIndicators.some(indicator => lowerContent.includes(indicator));
    
    // Should not be mostly navigation
    const navigationWords = ['menu', 'search', 'bills', 'meetings', 'session', 'legislators'];
    const navWordCount = navigationWords.filter(word => lowerContent.includes(word)).length;
    const isNotNavigation = navWordCount < 3;
    
    return hasLegalLanguage && isNotNavigation && content.length >= 50;
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
      { pattern: /infraction/i, penalty: 'Infraction' },
      { pattern: /fine/i, penalty: 'Fine' },
      { pattern: /civil penalty/i, penalty: 'Civil penalty' }
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
    
    // Enhanced summary generation based on content analysis
    if (lowerContent.includes('riot') || cite.includes('9A.84.010')) {
      return 'Defines riot as coordinated unlawful force by multiple people. Important for protesters to understand group dynamics and legal boundaries. Penalties can escalate if weapons are involved.';
    }
    
    if (lowerContent.includes('failure to disperse') || cite.includes('9A.84.020')) {
      return 'Requires dispersal when ordered by police if in groups. Know your rights but understand legal obligations when police issue lawful dispersal orders. Document the interaction if possible.';
    }
    
    if (lowerContent.includes('disorderly conduct') || cite.includes('9A.84.030')) {
      return 'Disorderly conduct can apply to protests. Avoid abusive language, disrupting lawful assemblies, or obstructing traffic. Understanding these boundaries helps keep protests legal.';
    }
    
    if ((lowerContent.includes('traffic') || lowerContent.includes('pedestrian')) && lowerContent.includes('roadway')) {
      return 'Blocking traffic can result in citations. Plan protest routes on sidewalks or obtain proper permits for street demonstrations. Consider safety of all participants.';
    }
    
    if (lowerContent.includes('trespass')) {
      return 'Trespassing laws may apply to protests on private property. Understand property boundaries and obtain permission when necessary. Public forums have different rules.';
    }
    
    if (lowerContent.includes('obstruct') && lowerContent.includes('officer')) {
      return 'Obstructing law enforcement can lead to charges. Know the difference between lawful observation and interference. Document interactions when legally possible.';
    }
    
    return 'This law may impact protest activities. Understanding these legal boundaries helps ensure your demonstrations remain within legal limits while exercising your constitutional rights.';
  }
  
  // Enhanced fallback data
  static getFallbackRCWData() {
    return [
      { cite: 'RCW 9A.84.010', title: 'Riot', shortTitle: 'Riot definition and penalties' },
      { cite: 'RCW 9A.84.020', title: 'Failure to disperse', shortTitle: 'Dispersal requirements' },
      { cite: 'RCW 9A.84.030', title: 'Disorderly conduct', shortTitle: 'Disorderly conduct definition' },
      { cite: 'RCW 46.61.250', title: 'Pedestrians on roadways', shortTitle: 'Traffic blocking laws' },
      { cite: 'RCW 9A.52.070', title: 'Criminal trespass in the first degree', shortTitle: 'Trespassing laws' },
      { cite: 'RCW 9A.76.020', title: 'Obstructing a law enforcement officer', shortTitle: 'Police interference' },
      { cite: 'RCW 46.61.015', title: 'Obstructing traffic', shortTitle: 'Traffic obstruction' },
      { cite: 'RCW 9A.48.020', title: 'Arson in the second degree', shortTitle: 'Property damage laws' }
    ];
  }
  
  // Enhanced fallback content
  static getFallbackRCWContent(cite) {
    const fallbackContent = {
      'RCW 9A.84.010': {
        title: 'Riot',
        content: '(1) A person is guilty of the crime of riot if, acting with four or more other persons, he or she knowingly and unlawfully uses or threatens to use force, or in any way participates in the use of such force, against any other person or against property. (2)(a) Except as provided in (b) of this subsection, the crime of riot is a gross misdemeanor. (b) The crime of riot is a class C felony if the actor is armed with a deadly weapon.',
        penalty: 'Gross misdemeanor (Class C felony if armed)',
        summary: 'Defines riot as coordinated unlawful force by 5+ people. Can be a gross misdemeanor or Class C felony if armed. Important to understand group dynamics in protests.'
      },
      'RCW 9A.84.020': {
        title: 'Failure to disperse',
        content: 'A person is guilty of failure to disperse if he or she congregates with a group of four or more other persons and in connection with and as a part of the group refuses or fails to disperse when ordered to do so by a peace officer.',
        penalty: 'Misdemeanor',
        summary: 'Requires dispersal when ordered by police if in groups of 5+. Know your rights but understand legal obligations when police issue lawful dispersal orders.'
      },
      'RCW 9A.84.030': {
        title: 'Disorderly conduct',
        content: 'A person is guilty of disorderly conduct if the person: (a) Uses abusive language and thereby intentionally creates a risk of assault; (b) Intentionally disrupts any lawful assembly or meeting of persons without lawful authority; (c) Intentionally obstructs vehicular or pedestrian traffic without lawful authority.',
        penalty: 'Misdemeanor',
        summary: 'Disorderly conduct can apply to protests. Avoid abusive language, disrupting lawful assemblies, or obstructing traffic without permits.'
      },
      'RCW 46.61.250': {
        title: 'Pedestrians on roadways',
        content: 'No pedestrian shall unnecessarily stop or delay traffic while upon the part of a highway intended for vehicular traffic.',
        penalty: 'Traffic infraction',
        summary: 'Blocking traffic can result in citations. Plan protest routes on sidewalks or obtain proper permits for street demonstrations.'
      },
      'RCW 9A.52.070': {
        title: 'Criminal trespass in the first degree',
        content: 'A person is guilty of criminal trespass in the first degree if he or she knowingly enters or remains unlawfully in a building.',
        penalty: 'Gross misdemeanor',
        summary: 'Trespassing laws apply to protests on private property. Know property boundaries and obtain permission when necessary.'
      },
      'RCW 9A.76.020': {
        title: 'Obstructing a law enforcement officer',
        content: 'A person is guilty of obstructing a law enforcement officer if the person willfully hinders, delays, or obstructs any law enforcement officer in the discharge of his or her official powers or duties.',
        penalty: 'Gross misdemeanor',
        summary: 'Obstructing law enforcement can lead to charges. Know the difference between lawful observation and interference.'
      },
      'RCW 46.61.015': {
        title: 'Obstructing traffic',
        content: 'No person shall stand or park a vehicle upon a highway in such a manner as to leave available less than ten feet of the width of the roadway for free movement of vehicular traffic.',
        penalty: 'Traffic infraction',
        summary: 'Vehicle-related traffic obstruction laws. Important for protest organizers planning demonstrations involving vehicles.'
      }
    };
    
    return fallbackContent[cite] || {
      title: 'Legal Section',
      content: 'Content temporarily unavailable. This legal section may impact protest activities. Please check the official Washington State Legislature website for current information.',
      penalty: 'Varies',
      summary: 'This legal section may impact protest activities. Consult official sources for current information and consider seeking legal advice for specific situations.'
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
      keys: Array.from(this.cache.keys()),
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Debug parsing method for troubleshooting
  static debugParseRCWHTML(html, cite) {
    const cleanText = this.cleanHTMLText(html);
    
    return {
      htmlLength: html.length,
      cleanedLength: cleanText.length,
      extractedTitle: this.extractTitle(html, cite),
      titlePatterns: [
        { pattern: 'title tag', found: /<title[^>]*>([^<]+)<\/title>/i.test(html) },
        { pattern: 'h1 tag', found: /<h1[^>]*>([^<]+)<\/h1>/i.test(html) },
        { pattern: 'h2 tag', found: /<h2[^>]*>([^<]+)<\/h2>/i.test(html) }
      ],
      contentAttempts: {
        strategy1: this.extractContentStrategy1(html)?.substring(0, 200) || 'Failed',
        strategy2: this.extractContentStrategy2(html)?.substring(0, 200) || 'Failed',
        strategy3: this.extractContentStrategy3(html)?.substring(0, 200) || 'Failed'
      },
      finalContent: this.extractContentMultiStrategy(html)?.substring(0, 200) || 'Failed',
      penalty: this.determinePenalty(cleanText),
      hasLegalKeywords: this.containsLegalKeywords(cleanText.toLowerCase()),
      allText: cleanText.substring(0, 2000) // First 2000 chars for manual inspection
    };
  }
  
  // Batch fetch multiple RCWs with rate limiting
  static async batchFetchRCWContent(cites, delayMs = 1000) {
    const results = [];
    
    console.log(`🔄 Starting batch fetch of ${cites.length} RCWs with ${delayMs}ms delay`);
    
    for (let i = 0; i < cites.length; i++) {
      const cite = cites[i];
      
      try {
        console.log(`📄 Fetching ${cite} (${i + 1}/${cites.length})`);
        const content = await this.fetchRCWContent(cite);
        results.push({ cite, success: true, content });
        
        // Rate limiting delay
        if (i < cites.length - 1) {
          console.log(`⏳ Waiting ${delayMs}ms before next request...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        console.error(`❌ Failed to fetch ${cite}:`, error.message);
        results.push({ 
          cite, 
          success: false, 
          error: error.message,
          content: this.getFallbackRCWContent(cite)
        });
      }
    }
    
    console.log(`✅ Batch fetch completed: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  }
}

module.exports = { WashingtonLegalService };