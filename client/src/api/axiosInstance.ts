import axios from 'axios';
import { store } from '../store/store';
import { logout, setTokens } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const scopedId = state.auth.scopedSchoolId;
    if (scopedId) {
      config.headers['x-school-id'] = scopedId;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: string) => void; reject: (reason: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle Token Refresh (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 2. Handle Global Error Notifications
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Only show toast if it's not a 401 (which is handled by refresh logic) 
    // and not a canceled request
    if (error.response?.status !== 401 && !axios.isCancel(error)) {
      toast.error(message, {
        id: 'global-error', // Prevent duplicate toasts
        duration: 4000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: 'bold',
          border: '1px solid #fecaca',
        }
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
