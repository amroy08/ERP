import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { ROLE_PERMISSIONS, PermissionType } from '../config/constants';

export const authorize = (...permissions: PermissionType[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasPermission = permissions.every((p) => userPermissions.includes(p));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required: ${permissions.join(', ')}`,
      });
      return;
    }

    next();
  };
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
