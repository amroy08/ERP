import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setCredentials, logout as logoutAction } from '../features/auth/authSlice';
import { User } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, accessToken } = useSelector((state: RootState) => state.auth);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    dispatch(setCredentials({ user: userData, accessToken, refreshToken }));
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    login,
    logout,
  };
};
