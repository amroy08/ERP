import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';
import { NotificationService } from '../services/NotificationService';
import { NotificationReminderService } from '../services/NotificationReminderService';
import prisma from '../config/prisma';
import { NotificationType } from '@prisma/client';

/**
 * Helper to validate parent-child linkage.
 */
const validateParentChildLink = async (parentUserId: string, studentId: string): Promise<boolean> => {
  const parent = await prisma.parent.findUnique({
    where: { userId: parentUserId },
    include: { children: { select: { id: true } } },
  });
  if (!parent) return false;
  return parent.children.some(child => child.id === studentId);
};

/**
 * Retrieve notifications for the authenticated user.
 */
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { studentId, isRead, limit, page } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
    const parsedPage = page ? parseInt(page as string, 10) : 1;
    const parsedIsRead = isRead !== undefined ? isRead === 'true' : undefined;

    // Security Check: If studentId is supplied, check parent-child linkage or student identity
    if (studentId && typeof studentId === 'string') {
      if (req.user!.role === 'parent') {
        const isLinked = await validateParentChildLink(userId, studentId);
        if (!isLinked) {
          next(createError('Access denied. This student is not linked to your account.', 403));
          return;
        }
      } else if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({ where: { userId } });
        if (!student || student.id !== studentId) {
          next(createError('Access denied. You can only view your own notifications.', 403));
          return;
        }
      } else if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
        next(createError('Access denied. Only parents, students, or admins can query by studentId.', 403));
        return;
      }
    }

    const result = await NotificationService.getUserNotifications({
      userId,
      studentId: studentId as string | undefined,
      isRead: parsedIsRead,
      limit: parsedLimit,
      page: parsedPage,
    });

    res.json({
      success: true,
      data: result.notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: n.priority,
        isRead: n.isRead,
        readAt: n.readAt,
        createdAt: n.createdAt,
        relatedEntityType: n.relatedEntityType,
        relatedEntityId: n.relatedEntityId,
        studentId: n.studentId,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get count of unread notifications for the authenticated user.
 */
export const getUnreadNotificationsCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { studentId } = req.query;

    if (studentId && typeof studentId === 'string') {
      if (req.user!.role === 'parent') {
        const isLinked = await validateParentChildLink(userId, studentId);
        if (!isLinked) {
          next(createError('Access denied. This student is not linked to your account.', 403));
          return;
        }
      } else if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({ where: { userId } });
        if (!student || student.id !== studentId) {
          next(createError('Access denied. You can only view your own unread count.', 403));
          return;
        }
      }
    }

    const result = await NotificationService.getUnreadCount(userId, studentId as string | undefined);
    res.json({
      success: true,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await NotificationService.markAsRead(id as string, userId);
    if (!notification) {
      next(createError('Notification not found or access denied.', 404));
      return;
    }

    res.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
        studentId: notification.studentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all unread notifications as read.
 */
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { studentId } = req.body;

    if (studentId && typeof studentId === 'string') {
      if (req.user!.role === 'parent') {
        const isLinked = await validateParentChildLink(userId, studentId);
        if (!isLinked) {
          next(createError('Access denied. This student is not linked to your account.', 403));
          return;
        }
      } else if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({ where: { userId } });
        if (!student || student.id !== studentId) {
          next(createError('Access denied. You can only update your own notifications.', 403));
          return;
        }
      }
    }

    await NotificationService.markAllAsRead(userId, studentId as string | undefined);
    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register mobile device token.
 */
export const registerDeviceToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token, deviceType, platform, appVersion } = req.body;

    if (!token) {
      next(createError('Device token is required.', 400));
      return;
    }
    if (deviceType !== 'ios' && deviceType !== 'android' && deviceType !== 'web') {
      next(createError('Invalid deviceType. Must be "ios", "android", or "web".', 400));
      return;
    }

    const deviceTokenObj = await NotificationService.registerDeviceToken({
      userId,
      token,
      deviceType,
      platform,
      appVersion,
    });

    res.json({
      success: true,
      message: 'Device token registered.',
      data: {
        id: deviceTokenObj.id,
        deviceType: deviceTokenObj.deviceType,
        platform: deviceTokenObj.platform,
        appVersion: deviceTokenObj.appVersion,
        isActive: deviceTokenObj.isActive,
        lastSeenAt: deviceTokenObj.lastSeenAt,
        createdAt: deviceTokenObj.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove mobile device token.
 */
export const removeDeviceToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    if (!token) {
      next(createError('Device token is required.', 400));
      return;
    }

    const result = await NotificationService.removeDeviceToken(userId, token);
    if (!result) {
      next(createError('Token not associated with authenticated user.', 403));
      return;
    }

    res.json({
      success: true,
      message: 'Device token unregistered.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only manual runner to scan and create reminders.
 */
export const runReminders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
      return;
    }

    const results = await NotificationReminderService.runAllReminderScans();
    res.json({
      success: true,
      message: 'Reminder scans completed successfully.',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all notification rules for the administrator's school (with default seeding).
 */
export const getAdminRules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }
    const schoolId = req.user!.schoolId;
    if (!schoolId) {
      res.status(400).json({ success: false, message: 'No school associated with user.' });
      return;
    }

    // Auto-create rules with safe defaults if they don't exist
    const defaultTypes: NotificationType[] = ['FEES_REMINDER', 'ATTENDANCE_ABSENCE_ALERT'];
    for (const type of defaultTypes) {
      await prisma.notificationRule.upsert({
        where: { schoolId_type: { schoolId, type } },
        create: {
          schoolId,
          type,
          enabled: true,
          cooldownHours: 24,
          thresholdCount: type === 'ATTENDANCE_ABSENCE_ALERT' ? 3 : null,
          thresholdDays: type === 'ATTENDANCE_ABSENCE_ALERT' ? 7 : null,
        },
        update: {},
      });
    }

    const rules = await prisma.notificationRule.findMany({
      where: { schoolId },
    });

    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a specific rule.
 */
export const updateAdminRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }
    const schoolId = req.user!.schoolId;
    if (!schoolId) {
      res.status(400).json({ success: false, message: 'No school associated with user.' });
      return;
    }

    const id = req.params.id as string;
    const { enabled, cooldownHours, thresholdCount, thresholdDays } = req.body;

    const rule = await prisma.notificationRule.findFirst({
      where: { id, schoolId },
    });

    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found or access denied.' });
      return;
    }

    // Validate inputs (only non-negative numbers allowed)
    if (cooldownHours !== undefined && (typeof cooldownHours !== 'number' || cooldownHours < 0)) {
      res.status(400).json({ success: false, message: 'cooldownHours must be a non-negative number.' });
      return;
    }
    if (thresholdCount !== undefined && thresholdCount !== null && (typeof thresholdCount !== 'number' || thresholdCount < 0)) {
      res.status(400).json({ success: false, message: 'thresholdCount must be a non-negative number.' });
      return;
    }
    if (thresholdDays !== undefined && thresholdDays !== null && (typeof thresholdDays !== 'number' || thresholdDays < 0)) {
      res.status(400).json({ success: false, message: 'thresholdDays must be a non-negative number.' });
      return;
    }

    const updated = await prisma.notificationRule.update({
      where: { id },
      data: {
        enabled: enabled !== undefined ? enabled : rule.enabled,
        cooldownHours: cooldownHours !== undefined ? cooldownHours : rule.cooldownHours,
        thresholdCount: thresholdCount !== undefined ? thresholdCount : rule.thresholdCount,
        thresholdDays: thresholdDays !== undefined ? thresholdDays : rule.thresholdDays,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated and filtered notification logs for admin.
 */
export const getAdminLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }
    const schoolId = req.user!.schoolId;
    if (!schoolId) {
      res.status(400).json({ success: false, message: 'No school associated with user.' });
      return;
    }

    const { type, recipientRole, isRead, priority, limit, page } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
    const parsedPage = page ? parseInt(page as string, 10) : 1;
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = { schoolId };

    if (type) {
      where.type = type;
    }
    if (recipientRole) {
      where.recipientRole = recipientRole;
    }
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    if (priority) {
      where.priority = priority;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parsedLimit,
        include: {
          deliveryLogs: {
            select: {
              channel: true,
              status: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: notifications.map(n => ({
        id: n.id,
        type: n.type,
        recipientRole: n.recipientRole,
        recipientUserId: n.recipientUserId,
        studentId: n.studentId,
        title: n.title,
        message: n.message,
        priority: n.priority,
        isRead: n.isRead,
        readAt: n.readAt,
        createdAt: n.createdAt,
        relatedEntityType: n.relatedEntityType,
        relatedEntityId: n.relatedEntityId,
        deliveryLogs: n.deliveryLogs,
      })),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve safe summary metrics of logs.
 */
export const getAdminLogsSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }
    const schoolId = req.user!.schoolId;
    if (!schoolId) {
      res.status(400).json({ success: false, message: 'No school associated with user.' });
      return;
    }

    const [total, read, unread, rulesCount] = await Promise.all([
      prisma.notification.count({ where: { schoolId } }),
      prisma.notification.count({ where: { schoolId, isRead: true } }),
      prisma.notification.count({ where: { schoolId, isRead: false } }),
      prisma.notificationRule.count({ where: { schoolId, enabled: true } }),
    ]);

    const typeCounts = await prisma.notification.groupBy({
      by: ['type'],
      where: { schoolId },
      _count: {
        id: true,
      },
    });

    const breakdown = typeCounts.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total,
        read,
        unread,
        activeRules: rulesCount,
        breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
