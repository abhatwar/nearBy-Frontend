import axios from 'axios';

const resolvedBaseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: resolvedBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message = 'Network error. Please check your connection and try again.';
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('nf_token');
      localStorage.removeItem('nf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
