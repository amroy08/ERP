import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

router.get('/stats', protect, authorize(PERMISSIONS.DASHBOARD_VIEW), getDashboardStats);

export default router;
