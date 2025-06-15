import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Token management
  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('authToken');
    }
    return this.token;
  }

  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
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

  // ===========================================
  // AUTHENTICATION ENDPOINTS
  // ===========================================

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    
    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }
    
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    
    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.log('Logout API call failed, clearing local token anyway');
    }
    await this.clearToken();
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  // ===========================================
  // EVENTS ENDPOINTS (Enhanced with Groups)
  // ===========================================

  async getEvents(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/events${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: eventData,
    });
  }

  async getEvent(eventId) {
    return this.request(`/events/${eventId}`);
  }

  async joinEvent(eventId, accessCode = null) {
    return this.request(`/events/${eventId}/join`, {
      method: 'POST',
      body: accessCode ? { access_code: accessCode } : {},
    });
  }

  async leaveEvent(eventId) {
    return this.request(`/events/${eventId}/leave`, {
      method: 'DELETE',
    });
  }

  // NEW: Group-specific events
  async getGroupEvents(groupId, filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/events/groups/${groupId}/events${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async updateEventGroup(eventId, groupData) {
    return this.request(`/events/${eventId}/group`, {
      method: 'PUT',
      body: groupData,
    });
  }

  // src/services/Api.js - Add this method to your existing ApiService class

// 🔥 NEW: Add this method to your ApiService class
async getGroupEvents(groupId, params = {}) {
  console.log('🌐 API: Getting events for group', groupId, 'with params:', params);
  
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `/events/groups/${groupId}/events${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request(url);
    
    console.log('✅ API: Group events response:', response?.success ? 'SUCCESS' : 'FAILED');
    return response;
  } catch (error) {
    console.error('❌ API: Get group events error:', error);
    throw error;
  }
}

  // ===========================================
  // GROUPS ENDPOINTS
  // ===========================================

  async getGroups(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/groups${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async createGroup(groupData) {
    return this.request('/groups', {
      method: 'POST',
      body: groupData,
    });
  }

  async getGroup(groupId) {
    return this.request(`/groups/${groupId}`);
  }

  async updateGroup(groupId, groupData) {
    return this.request(`/groups/${groupId}`, {
      method: 'PUT',
      body: groupData,
    });
  }

  async deleteGroup(groupId) {
    return this.request(`/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  async joinGroup(groupId) {
    return this.request(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId) {
    return this.request(`/groups/${groupId}/leave`, {
      method: 'DELETE',
    });
  }

  async getGroupMembers(groupId, filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/groups/${groupId}/members${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async updateMemberRole(groupId, userId, role) {
    return this.request(`/groups/${groupId}/members/${userId}`, {
      method: 'PUT',
      body: { role },
    });
  }

  async removeMember(groupId, userId) {
    return this.request(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getMyGroups(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/groups/my-groups${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  // ===========================================
  // COMMUNITY ENDPOINTS
  // ===========================================

  async getForums(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    

    const endpoint = `/community/forums${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async createForum(forumData) {
    return this.request('/community/forums', {
      method: 'POST',
      body: forumData,
    });
  }

  async getForum(forumId) {
    return this.request(`/community/forums/${forumId}`);
  }

  async getForumPosts(forumId, filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/community/forums/${forumId}/posts${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async createPost(forumId, postData) {
    return this.request(`/community/forums/${forumId}/posts`, {
      method: 'POST',
      body: postData,
    });
  }

  async getPost(postId) {
    return this.request(`/community/posts/${postId}`);
  }

  async addComment(postId, commentData) {
    return this.request(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: commentData,
    });
  }

  async updateComment(postId, commentId, content) {
    return this.request(`/community/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      body: { content },
    });
  }

  async deleteComment(postId, commentId) {
    return this.request(`/community/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }
  

  // ===========================================
  // NOTIFICATIONS ENDPOINTS (NEW!)
  // ===========================================

  async getNotifications(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/notifications${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================
  // LEGAL RESOURCES ENDPOINTS
  // ===========================================

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

  async getJurisdictionData(state){
    const queryParams = new URLSearchParams();
    queryParams.append([0, state]);
    const endpoint = `/legal/data/jurisdiction${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  async checkHealth() {
    return fetch(`${this.baseURL.replace('/api', '')}/health`).then(res => res.json());
  }

  async testConnection() {
    return this.request('/test');
  }
}

// Export singleton instance
export default new ApiService();