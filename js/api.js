/**
 * CampusHub Frontend API Client
 * Seamlessly interfaces the frontend HTML pages with the Express.js & MongoDB REST API.
 * Includes automatic JWT header injection.
 */

const API_BASE = 'http://localhost:5000/api/v1';

const CampusAPI = {
  // Token & Session Storage
  getToken() {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('campushub_jwt_token') || localStorage.getItem('token');
  },

  setSession(token, user) {
    if (typeof localStorage === 'undefined') return;
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
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('campushub_jwt_token');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  },

  getCurrentUser() {
    if (typeof localStorage === 'undefined') return null;
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
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body && !isFormData && !headers['Content-Type']) {
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

  // Auth & Profile Endpoints (Topic 57)
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
    try {
      const res = await this.request('/auth/me', { method: 'GET' });
      if (res?.data?.user) {
        const token = this.getToken();
        this.setSession(token, res.data.user);
      }
      return res;
    } catch (err) {
      return null;
    }
  },

  // Role & Authorization Helpers (Strictly driven by verified backend user state)
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role ? String(user.role).toLowerCase() : 'guest';
  },

  isAdmin() {
    return this.getUserRole() === 'admin';
  },

  isFaculty() {
    return this.getUserRole() === 'faculty';
  },

  canManageSubjects() {
    const role = this.getUserRole();
    return role === 'admin' || role === 'faculty';
  },

  canManageResources() {
    const role = this.getUserRole();
    return role === 'admin' || role === 'faculty';
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

  async createSubject(subjectData) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData)
    });
  },

  async updateSubject(id, subjectData) {
    return this.request(`/subjects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(subjectData)
    });
  },

  async deleteSubject(id) {
    return this.request(`/subjects/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Notes Endpoints (Topic 55, 56 & 58)
  async getNotes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/notes${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint, { method: 'GET' });
  },

  async getNote(id) {
    return this.request(`/notes/${encodeURIComponent(id)}`, { method: 'GET' });
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

  async updateNote(id, noteData) {
    return this.request(`/notes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(noteData)
    });
  },

  async deleteNote(id) {
    return this.request(`/notes/${encodeURIComponent(id)}`, {
      method: 'DELETE'
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
    const payload = {};
    if (noteId) payload.noteId = noteId;
    if (subjectId) payload.subjectId = subjectId;

    return this.request('/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteBookmark(bookmarkId) {
    return this.request(`/bookmarks/${encodeURIComponent(bookmarkId)}`, {
      method: 'DELETE'
    });
  },

  // Download URL Builder (Course Topic 52 & 57)
  getDownloadUrl(fileUrlOrName) {
    if (!fileUrlOrName) return '#';
    let path = fileUrlOrName;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const token = this.getToken();
      if (token && !path.includes('token=')) {
        const sep = path.includes('?') ? '&' : '?';
        return `${path}${sep}token=${encodeURIComponent(token)}`;
      }
      return path;
    }
    if (!path.startsWith('/')) {
      path = `/resources/download/${path}`;
    } else if (path.startsWith('/api/v1/')) {
      path = path.replace('/api/v1', '');
    }
    let url = `${API_BASE}${path}`;
    const token = this.getToken();
    if (token && !url.includes('token=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}token=${encodeURIComponent(token)}`;
    }
    return url;
  }
};

if (typeof window !== 'undefined') {
  window.CampusAPI = CampusAPI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampusAPI;
}
