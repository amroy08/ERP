import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'school_erp_access_token';
const REFRESH_TOKEN_KEY = 'school_erp_refresh_token';

const isWeb = Platform.OS === 'web';

export const saveAccessToken = async (token: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
};

export const getAccessToken = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (e) {
    console.warn('[SecureStore] Failed to get access token:', e);
    return null;
  }
};

export const removeAccessToken = async (): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
};

export const saveRefreshToken = async (token: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn('[SecureStore] Failed to get refresh token:', e);
    return null;
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const clearAuthTokens = async (): Promise<void> => {
  await Promise.all([
    removeAccessToken(),
    removeRefreshToken()
  ]);
};
