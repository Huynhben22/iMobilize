class LegalApiService {
  constructor() {
    // Update this URL to match your backend
    this.baseURL = 'http://localhost:3000/api';
    // For production or testing on device, use your computer's IP:
    // this.baseURL = 'http://192.168.1.XXX:3000/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Get all legal documents
  async getLegalData(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/legal/data${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  // Search legal documents
  async searchLegalData(searchTerm, options = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', searchTerm);
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/legal-test/search?${queryParams}`;
    return this.request(endpoint);
  }

  // Get specific legal document by cite
  async getLegalDocumentByCite(cite) {
    return this.request(`/legal-test/verify-storage/${encodeURIComponent(cite)}`);
  }

  // Get system status
  async getSystemStatus() {
    return this.request('/legal-test/status');
  }

  // Update a single RCW (for testing)
  async updateSingleRCW(cite) {
    return this.request('/legal-test/update-single', {
      method: 'POST',
      body: JSON.stringify({ cite }),
    });
  }

  // Check API connectivity
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new LegalApiService();