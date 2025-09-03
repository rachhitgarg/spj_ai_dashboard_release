import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getTutor: (params) => api.get('/analytics/tutor', { params }),
  getMentor: (params) => api.get('/analytics/mentor', { params }),
  getJPT: (params) => api.get('/analytics/jpt', { params }),
};

// Cohorts API
export const cohortsAPI = {
  getAll: (params) => api.get('/cohorts', { params }),
  getById: (cohortId) => api.get(`/cohorts/${cohortId}`),
  getStats: (cohortId) => api.get(`/cohorts/${cohortId}/stats`),
};

// Placements API
export const placementsAPI = {
  getAll: (params) => api.get('/placements', { params }),
  getVisits: (params) => api.get('/placements/visits', { params }),
};

// Tutor API
export const tutorAPI = {
  getSessions: (params) => api.get('/tutor/sessions', { params }),
  getUtilization: (params) => api.get('/tutor/utilization', { params }),
  getWeekly: (params) => api.get('/tutor/weekly', { params }),
  getSummary: (params) => api.get('/tutor/summary', { params }),
};

// Mentor API
export const mentorAPI = {
  getAll: (params) => api.get('/mentor', { params }),
};

// JPT API
export const jptAPI = {
  getAll: (params) => api.get('/jpt', { params }),
};

// Upload API
export const uploadAPI = {
  uploadFile: (tableName, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/${tableName}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getTemplates: () => api.get('/upload/templates'),
  downloadTemplate: (filename) => api.get(`/upload/templates/${filename}`, {
    responseType: 'blob',
  }),
  getHistory: () => api.get('/upload/history'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
