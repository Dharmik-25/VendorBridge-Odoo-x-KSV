import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh transparently on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If token expired, attempt silent refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('vb_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('http://localhost:5000/api/v1/auth/refresh', {
            refreshToken,
          });
          const { accessToken } = res.data.data;
          
          localStorage.setItem('vb_token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Silent refresh token expired or failed:', refreshError);
          
          // Clear credentials and force redirect to login
          localStorage.removeItem('vb_token');
          localStorage.removeItem('vb_refresh_token');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error.response?.data?.error || { message: error.message || 'Server connection error' });
  }
);

export default api;
