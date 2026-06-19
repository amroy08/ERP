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
  runReminders
} from '../controllers/notificationController';

const router = Router();

// Apply auth middleware to protect all notification routes
router.use(protect);

// Admin manual scan runner
router.post('/admin/run-reminders', requireRoles('admin', 'super_admin'), runReminders);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationsCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', removeDeviceToken);

export default router;
