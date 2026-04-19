import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bmptn_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
);

export const meetingsService = {
  // Get artisan availability
  async getArtisanAvailability(artisanId, month = null) {
    const params = {};
    if (month) {
      params.month = month; // Format: 2026-04
    }
    const response = await api.get(`/meetings/availability/${artisanId}`, { params });
    return response.data;
  },

  // Create a new meeting
  async createMeeting(meetingData) {
    const response = await api.post('/meetings', meetingData);
    return response.data;
  },

  // Get artisan's meetings
  async getArtisanMeetings(status = null) {
    const params = {};
    if (status) {
      params.status = status;
    }
    const response = await api.get('/meetings/artisan/list', { params });
    return response.data;
  },

  // Get prescripteur's meetings
  async getPrescripteurMeetings(status = null) {
    const params = {};
    if (status) {
      params.status = status;
    }
    const response = await api.get('/meetings/prescripteur/list', { params });
    return response.data;
  },

  // Get meeting details
  async getMeeting(id) {
    const response = await api.get(`/meetings/${id}`);
    return response.data;
  },

  // Accept meeting
  async acceptMeeting(id) {
    const response = await api.patch(`/meetings/${id}/accept`);
    return response.data;
  },

  // Reject meeting
  async rejectMeeting(id, notes = '') {
    const response = await api.patch(`/meetings/${id}/reject`, { notes });
    return response.data;
  },

  // Cancel meeting
  async cancelMeeting(id) {
    const response = await api.delete(`/meetings/${id}`);
    return response.data;
  },
};

export default meetingsService;
