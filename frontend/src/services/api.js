import axios from 'axios';

// API base URL - Production backend on Render
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://homehero-synap5e.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Format error for easier handling - preserve original error object
    if (error.response) {
      // Server responded with error status
      const formattedError = new Error(error.message || `Request failed with status code ${error.response.status}`);
      formattedError.status = error.response.status;
      formattedError.data = error.response.data;
      formattedError.detail = error.response.data?.detail;
      formattedError.response = error.response;
      formattedError.originalError = error;
      
      console.error('API Error:', {
        status: formattedError.status,
        data: formattedError.data,
        detail: formattedError.detail,
      });
      
      return Promise.reject(formattedError);
    }

    // Network error or no response
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (email_or_phone, password) => {
    const response = await api.post('/auth/login', {
      email_or_phone,
      password,
    });
    
    // Store tokens
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return response.data;
  },
};

// ==================== USER ENDPOINTS ====================

export const userAPI = {
  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  // Set user location
  setLocation: async (location, pincode) => {
    const response = await api.post('/users/location', { location, pincode });
    return response.data;
  },
};

// ==================== PROVIDER ENDPOINTS ====================

export const providerAPI = {
  // Search providers
  searchProviders: async (params) => {
    const response = await api.get('/providers', { params });
    return response.data;
  },

  // Enhanced search with geolocation
  searchProvidersEnhanced: async (params) => {
    const response = await api.get('/providers/search', { params });
    return response.data;
  },

  // Get provider profile by ID
  getProvider: async (providerId) => {
    const response = await api.get(`/providers/${providerId}`);
    return response.data;
  },

  // Get current user's provider profile
  getMyProviderProfile: async () => {
    const response = await api.get('/providers/me');
    return response.data;
  },

  // Create provider profile
  createProviderProfile: async (providerData) => {
    const response = await api.post('/providers', providerData);
    return response.data;
  },

  // Update provider profile
  updateProviderProfile: async (providerData) => {
    const response = await api.put('/providers/me', providerData);
    return response.data;
  },

  // Update pricing
  updatePricing: async (pricing) => {
    const response = await api.put('/providers/pricing', { pricing });
    return response.data;
  },

  // Update availability
  updateAvailability: async (available) => {
    const response = await api.put('/providers/availability', { available });
    return response.data;
  },

  // Upload portfolio images
  uploadPortfolio: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/providers/portfolio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get service suggestions
  getServiceSuggestions: async (query) => {
    const response = await api.get(`/providers/suggest/${query}`);
    return response.data;
  },
};

// ==================== SERVICE ENDPOINTS ====================

export const serviceAPI = {
  // Get all services
  getAllServices: async () => {
    const response = await api.get('/services');
    return response.data;
  },

  // Get service by ID
  getService: async (serviceId) => {
    const response = await api.get(`/services/${serviceId}`);
    return response.data;
  },
};

// ==================== BOOKING ENDPOINTS ====================

export const bookingAPI = {
  // Create new booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Get user's bookings
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  // Get booking by ID
  getBooking: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Get booking status
  getBookingStatus: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/status`);
    return response.data;
  },

  // Request callback
  requestCallback: async (callbackData) => {
    const response = await api.post('/bookings/requests/callback', callbackData);
    return response.data;
  },

  // Get pending bookings (provider only)
  getPendingBookings: async () => {
    const response = await api.get('/bookings/provider/pending');
    return response.data;
  },

  // Respond to booking (provider only)
  respondToBooking: async (bookingId, status) => {
    const response = await api.post(`/bookings/${bookingId}/respond`, { status });
    return response.data;
  },

  // Cancel booking (customer)
  cancelBooking: async (bookingId, reason) => {
    const response = await api.delete(`/bookings/${bookingId}`, {
      data: { reason },
    });
    return response.data;
  },

  // Cancel booking (provider)
  providerCancelBooking: async (bookingId, reason) => {
    const response = await api.delete(`/bookings/${bookingId}/provider-cancel`, {
      data: { reason },
    });
    return response.data;
  },

  // Reschedule booking
  rescheduleBooking: async (bookingId, new_date_time, reason) => {
    const response = await api.put(`/bookings/${bookingId}/reschedule`, {
      new_date_time,
      reason,
    });
    return response.data;
  },

  // Check if booking can be cancelled
  canCancelBooking: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/can-cancel`);
    return response.data;
  },

  // Mark booking as completed (customer only)
  completeBooking: async (bookingId) => {
    const response = await api.post(`/bookings/${bookingId}/complete`);
    return response.data;
  },
};

// ==================== REVIEW ENDPOINTS ====================

export const reviewAPI = {
  // Submit review
  submitReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Get provider reviews
  getProviderReviews: async (providerId, skip = 0, limit = 20) => {
    const response = await api.get(`/reviews/provider/${providerId}`, {
      params: { skip, limit },
    });
    return response.data;
  },

  // Get user's reviews
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  // Update review
  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Delete review
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

// ==================== ADMIN ENDPOINTS ====================

export const adminAPI = {
  // Approve provider
  approveProvider: async (providerId) => {
    const response = await api.post(`/admin/providers/${providerId}/approve`);
    return response.data;
  },

  // Get all bookings
  getAllBookings: async () => {
    const response = await api.get('/admin/bookings');
    return response.data;
  },

  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
};

// ==================== VERIFICATION ENDPOINTS ====================

export const verificationAPI = {
  // Submit provider verification
  submitVerification: async (verificationData) => {
    const response = await api.post('/verification/submit', verificationData);
    return response.data;
  },

  // Upload document
  uploadDocument: async (documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    const response = await api.post('/verification/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        document_type: documentType,
      },
    });
    return response.data;
  },

  // Get verification status
  getStatus: async () => {
    const response = await api.get('/verification/status');
    return response.data;
  },
};

export default api;
