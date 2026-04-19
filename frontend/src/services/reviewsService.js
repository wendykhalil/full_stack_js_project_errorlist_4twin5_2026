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

export const reviewsService = {
  // Get reviews for an artisan
  async getArtisanReviews(artisanId) {
    try {
      const response = await api.get(`/reviews/user/${artisanId}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  // Create a new review
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  // Get pending reviews (service requests that can be reviewed)
  async getPendingReviews() {
    try {
      const response = await api.get('/reviews/pending');
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  // Delete a review
  async deleteReview(reviewId) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  },
};

export default reviewsService;
