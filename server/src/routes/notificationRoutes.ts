import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  registerDeviceToken,
  removeDeviceToken,
  runReminders,
  getAdminRules,
  updateAdminRule,
  getAdminLogs,
  getAdminLogsSummary
} from '../controllers/notificationController';

const router = Router();

// Apply auth middleware to protect all notification routes
router.use(protect);

// Admin manual scan runner & config rule / logs check
router.post('/admin/run-reminders', requireRoles('admin', 'super_admin'), runReminders);
router.get('/admin/rules', requireRoles('admin', 'super_admin'), getAdminRules);
router.put('/admin/rules/:id', requireRoles('admin', 'super_admin'), updateAdminRule);
router.get('/admin/logs', requireRoles('admin', 'super_admin'), getAdminLogs);
router.get('/admin/logs/summary', requireRoles('admin', 'super_admin'), getAdminLogsSummary);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationsCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', removeDeviceToken);

export default router;
