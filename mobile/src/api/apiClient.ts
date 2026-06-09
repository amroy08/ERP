import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { getAccessToken, clearAuthTokens } from '../utils/secureStorage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to inject JWT Access Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('[API Client] Error reading access token:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration / 401s
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 Unauthorized and request has not been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Placeholder for refresh token request in Phase 3.0D
        // const newTokens = await refreshAuthTokens();
        // if (newTokens) {
        //   originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        //   return apiClient(originalRequest);
        // }
      } catch (refreshError) {
        console.error('[API Client] Token refresh retry failed:', refreshError);
        await clearAuthTokens();
        // Redirect to login flow via auth context later
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
