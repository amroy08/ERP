import { Router } from 'express';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { Response, NextFunction } from 'express';
import {
  getAllSchools,
  getSchoolDetail,
  createSchool,
  updateSchool,
  deleteSchool,
  createSchoolAdmin,
} from '../controllers/schoolsAdminController';

const router = Router();

// Super admin only middleware
const superAdminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Access restricted to Super Admin only.' });
    return;
  }
  next();
};

// All routes require authentication + super_admin role
router.use(protect, superAdminOnly);

router.get('/', getAllSchools);
router.post('/', createSchool);
router.get('/:id', getSchoolDetail);
router.put('/:id', updateSchool);
router.delete('/:id', deleteSchool);
router.post('/:id/admin', createSchoolAdmin);

export default router;
