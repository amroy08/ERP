import { Router } from 'express';
import { exportReport } from '../controllers/reportController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { Role } from '@prisma/client';

import { PERMISSIONS } from '../config/constants';

const router = Router();

// Only admin, super_admin, and principal can export reports (based on constants.ts permissions)
router.get('/export', protect, authorize(PERMISSIONS.REPORT_EXPORT), exportReport);

export default router;
