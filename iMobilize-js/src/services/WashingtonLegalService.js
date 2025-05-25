// File: src/services/WashingtonLegalService.js

export class WashingtonLegalService {
  static BASE_URL = 'https://lawdoccitelookup.leg.wa.gov/v1';
  
  // Fetch available RCW citations
  static async fetchRCWCitations(searchTerm = '') {
    try {
      const response = await fetch(`${this.BASE_URL}/rcw`);
      const data = await response.json();
      
      // Filter for protest-related laws
      const protestKeywords = ['riot', 'assembly', 'disorderly', 'obstruct', 'permit', 'demonstration'];
      const filteredData = data.filter(item => 
        protestKeywords.some(keyword => 
          item.cite?.toLowerCase().includes(keyword) || 
          item.title?.toLowerCase().includes(keyword)
        )
      );
      
      return filteredData.slice(0, 10); // Limit for demo
    } catch (error) {
      console.error('Error fetching RCW citations:', error);
      return [];
    }
  }
  
  // Fetch specific RCW section content
  static async fetchRCWContent(cite) {
    try {
      // This would typically scrape the HTML content
      // For demo purposes, returning mock structured data
      const mockContent = {
        'RCW 9A.84.010': {
          title: 'Riot',
          content: 'A person is guilty of riot if, acting with four or more other persons, he or she knowingly and unlawfully uses or threatens to use force, or in any way participates in the use of such force, against any other person or against property.',
          penalty: 'Class C felony',
          summary: 'Defines riot as coordinated unlawful force by 5+ people. Important for protesters to understand group dynamics and legal boundaries.'
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
      
      return mockContent[cite] || {
        title: 'Legal Section',
        content: 'Content not available in demo mode',
        penalty: 'Varies',
        summary: 'This would contain AI-generated plain language summary of the legal text.'
      };
    } catch (error) {
      console.error('Error fetching RCW content:', error);
      return null;
    }
  }

  // Fetch Washington Administrative Code (WAC) for permit requirements
  static async fetchWACContent(cite) {
    try {
      // Mock WAC content for permit-related regulations
      const mockWACContent = {
        'WAC 308-96A-200': {
          title: 'Sound amplification permits',
          content: 'Sound amplification devices require permits in most municipalities. Check with local authorities for specific requirements.',
          penalty: 'Fine up to $500',
          summary: 'Most cities require permits for amplified sound at protests. Check local ordinances before your event.'
        }
      };
      
      return mockWACContent[cite] || null;
    } catch (error) {
      console.error('Error fetching WAC content:', error);
      return null;
    }
  }

  // Get recent bills related to protest rights
  static async fetchRecentProtestBills() {
    try {
      // This would integrate with Open States API
      // Returning mock data for demonstration
      const mockBills = [
        {
          id: 'WA-2025-SB-1234',
          title: 'An Act Relating to Public Assembly Rights',
          status: 'In Committee',
          summary: 'Strengthens protections for peaceful assembly and clarifies police response protocols.',
          introduced: '2025-01-15',
          chamber: 'Senate'
        }
      ];
      
      return mockBills;
    } catch (error) {
      console.error('Error fetching recent bills:', error);
      return [];
    }
  }

  // Generate plain-language summary (would integrate with AI service)
  static async generateSummary(legalText) {
    try {
      // This would call an AI service to generate plain-language summaries
      // For now, returning mock summaries based on keywords
      if (legalText.toLowerCase().includes('riot')) {
        return 'This law defines when a gathering becomes a riot. Key point: it requires 5+ people and the use or threat of force.';
      }
      
      return 'This legal text has been simplified for easier understanding. Consult a lawyer for specific legal advice.';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Summary not available';
    }
  }
}