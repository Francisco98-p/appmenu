import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Add Interceptors if needed (e.g., for JWT)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token'); // Clear auth persistence
      localStorage.removeItem('user-storage'); // Clear zustand auth state if stored here
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
