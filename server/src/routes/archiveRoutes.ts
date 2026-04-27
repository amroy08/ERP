import { Router } from 'express';
import { getArchives, restoreArchive, purgeArchive } from '../controllers/moduleController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

router.get('/', protect, authorize(PERMISSIONS.SETTINGS_UPDATE), getArchives);
router.post('/:id/restore', protect, authorize(PERMISSIONS.SETTINGS_UPDATE), restoreArchive);
router.delete('/:id', protect, authorize(PERMISSIONS.SETTINGS_UPDATE), purgeArchive);

export default router;
