import apiClient from './apiClient';

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const changeUserPassword = async (currentPassword: string, newPassword: string) => {
  const response = await apiClient.put('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};
