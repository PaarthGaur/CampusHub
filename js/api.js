/**
 * CampusHub Frontend API Client
 * Seamlessly interfaces the frontend HTML pages with the Express.js & MongoDB REST API.
 * Includes automatic JWT header injection and offline fallback.
 */

const API_BASE = 'http://localhost:5000/api/v1';

const CampusAPI = {
  // Token & Session Storage
  getToken() {
    return localStorage.getItem('campushub_jwt_token') || localStorage.getItem('token');
  },

  setSession(token, user) {
    if (token) {
      localStorage.setItem('campushub_jwt_token', token);
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
    }
  },

  clearSession() {
    localStorage.removeItem('campushub_jwt_token');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  // Base HTTP Request Helper
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.headers || {})
    };

    // If body is not FormData, default to application/json
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[CampusAPI Warning] Endpoint '${endpoint}':`, err.message);
      throw err;
    }
  },

  // Auth Endpoints (Topic 57)
  async signup(userData) {
    const res = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res?.token) {
      this.setSession(res.token, res.data?.user);
    }
    return res;
  },

  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res?.token) {
      this.setSession(res.token, res.data?.user);
    }
    return res;
  },

  async getProfile() {
    return this.request('/auth/me', { method: 'GET' });
  },

  // Subjects Endpoints (Topic 55 & 56)
  async getSubjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/subjects${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint, { method: 'GET' });
  },

  async getSubject(identifier) {
    return this.request(`/subjects/${encodeURIComponent(identifier)}`, { method: 'GET' });
  },

  // Notes Endpoints (Topic 55, 56 & 58)
  async getNotes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/notes${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint, { method: 'GET' });
  },

  async createNote(noteData) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  },

  // Multer File Upload Endpoint (Topic 58)
  async uploadNoteWithFile(formData) {
    return this.request('/notes/with-file', {
      method: 'POST',
      body: formData // Automatically sets multipart/form-data boundary
    });
  },

  async toggleLike(noteId) {
    return this.request(`/notes/${noteId}/like`, { method: 'POST' });
  },

  // Bookmarks Endpoints
  async getBookmarks() {
    return this.request('/bookmarks', { method: 'GET' });
  },

  async toggleBookmark(noteId, subjectId) {
    return this.request('/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ noteId, subjectId })
    });
  }
};

if (typeof window !== 'undefined') {
  window.CampusAPI = CampusAPI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampusAPI;
}
