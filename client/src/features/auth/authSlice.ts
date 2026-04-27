import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';

const storedUser = localStorage.getItem('erp_user');
const storedAccessToken = localStorage.getItem('erp_access_token');
const storedRefreshToken = localStorage.getItem('erp_refresh_token');

const storedScopedId = localStorage.getItem('erp_scoped_school_id');
const storedScopedName = localStorage.getItem('erp_scoped_school_name');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: !!storedAccessToken && !!storedUser,
  isLoading: false,
  scopedSchoolId: storedScopedId,
  scopedSchoolName: storedScopedName,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;

      localStorage.setItem('erp_user', JSON.stringify(action.payload.user));
      localStorage.setItem('erp_access_token', action.payload.accessToken);
      localStorage.setItem('erp_refresh_token', action.payload.refreshToken);
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('erp_access_token', action.payload.accessToken);
      localStorage.setItem('erp_refresh_token', action.payload.refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_access_token');
      localStorage.removeItem('erp_refresh_token');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSchoolScope: (state, action: PayloadAction<{ id: string; name: string } | null>) => {
      if (action.payload) {
        state.scopedSchoolId = action.payload.id;
        state.scopedSchoolName = action.payload.name;
        localStorage.setItem('erp_scoped_school_id', action.payload.id);
        localStorage.setItem('erp_scoped_school_name', action.payload.name);
      } else {
        state.scopedSchoolId = null;
        state.scopedSchoolName = null;
        localStorage.removeItem('erp_scoped_school_id');
        localStorage.removeItem('erp_scoped_school_name');
      }
    },
  },
});

export const { setCredentials, setTokens, logout, setLoading, setSchoolScope } = authSlice.actions;
export default authSlice.reducer;
