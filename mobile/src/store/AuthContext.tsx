import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserProfile, SchoolContext } from '../types/auth.types';
import {
  clearAuthTokens,
  saveAccessToken,
  saveRefreshToken,
  getAccessToken,
} from '../utils/secureStorage';
import { loginUser, fetchCurrentUser } from '../api/authApi';
import {
  registerForPushNotificationsAsync,
  unregisterForPushNotificationsAsync,
  setupNotificationListeners,
} from '../services/notificationService';

interface AuthContextType {
  user: UserProfile | null;
  school: SchoolContext | null;
  role: 'parent' | 'student' | 'teacher' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Normalize the backend role string to a mobile role.
 * Backend roles: super_admin | admin | principal | teacher | clerk | parent | student
 */
const toMobileRole = (
  backendRole: string
): 'parent' | 'student' | 'teacher' | null => {
  if (backendRole === 'parent') return 'parent';
  if (backendRole === 'student') return 'student';
  if (backendRole === 'teacher') return 'teacher';
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<SchoolContext | null>(null);
  const [role, setRole] = useState<'parent' | 'student' | 'teacher' | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // ────────────────────────────────────────────────────────
  // Restore session on cold start
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const existingToken = await getAccessToken();
        if (!existingToken) {
          setIsLoading(false);
          return;
        }
        // Validate token by fetching current user
        const meData = await fetchCurrentUser();
        const meUser = meData?.data?.user ?? meData?.user;
        const meSchool = meData?.data?.school ?? meData?.school;
        if (meUser) {
          const restoredUser: UserProfile = meUser;
          const restoredRole = toMobileRole(restoredUser.role);
          setUser(restoredUser);
          setRole(restoredRole);
          if (meSchool) setSchool(meSchool);

          // Asynchronously register push notifications
          registerForPushNotificationsAsync().then(token => {
            if (token) setPushToken(token);
          });
        }
      } catch {
        // Token invalid / expired – clear and show login
        await clearAuthTokens();
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Setup foreground & response listeners for push notifications when authenticated
  useEffect(() => {
    if (user) {
      const cleanup = setupNotificationListeners();
      return cleanup;
    }
  }, [user]);

  // ────────────────────────────────────────────────────────
  // Real login
  // ────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    try {
      const resData = await loginUser(email, password);
      const data = resData?.data ?? resData;

      // Backend returns: { accessToken, refreshToken, user, school }
      if (!data?.accessToken) throw new Error('No access token returned.');

      await saveAccessToken(data.accessToken);
      if (data.refreshToken) await saveRefreshToken(data.refreshToken);

      const loggedInUser: UserProfile = data.user;
      const mobileRole = toMobileRole(loggedInUser.role);

      if (!mobileRole) {
        throw new Error(
          `Role '${loggedInUser.role}' does not have mobile access. Only parent, student, and teacher accounts can use the mobile app.`
        );
      }

      setUser(loggedInUser);
      setRole(mobileRole);
      if (data.school) setSchool(data.school);

      // Asynchronously register push notifications
      registerForPushNotificationsAsync().then(token => {
        if (token) setPushToken(token);
      });
    } catch (e) {
      throw e;
    }
  };

  // ────────────────────────────────────────────────────────
  // Sign out
  // ────────────────────────────────────────────────────────
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (pushToken) {
        await unregisterForPushNotificationsAsync(pushToken);
        setPushToken(null);
      }
      await clearAuthTokens();
      setUser(null);
      setSchool(null);
      setRole(null);
    } catch (e) {
      console.error('[AuthContext] Error signing out:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        role,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
