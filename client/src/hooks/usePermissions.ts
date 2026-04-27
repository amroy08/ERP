import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { PermissionType } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = useCallback((permission: PermissionType): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: PermissionType[]): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    return permissions.some(p => user.permissions.includes(p));
  }, [user]);

  const isRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  const result = useMemo(() => ({
    hasPermission,
    hasAnyPermission,
    isRole,
    role: user?.role
  }), [hasPermission, hasAnyPermission, isRole, user?.role]);

  return result;
};
