import { Router } from 'express';
import { getRoutes, createRoute, getVehicles, createVehicle } from '../controllers/transportController';
import { protect } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';

const router = Router();

router.use(protect);

router.get('/routes', getRoutes);
router.post('/routes', requireRoles('admin', 'super_admin'), createRoute);
router.get('/vehicles', getVehicles);
router.post('/vehicles', requireRoles('admin', 'super_admin'), createVehicle);

export default router;
