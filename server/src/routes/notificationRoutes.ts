import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  registerDeviceToken,
  removeDeviceToken
} from '../controllers/notificationController';

const router = Router();

// Apply auth middleware to protect all notification routes
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationsCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', removeDeviceToken);

export default router;
