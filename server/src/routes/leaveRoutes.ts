import { Router } from 'express';
import { getStudentLeaves, createLeaveRequest, updateLeaveStatus } from '../controllers/leaveController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

router.get('/student/:studentId', protect, getStudentLeaves);
router.post('/', protect, createLeaveRequest);
router.put('/:id/status', protect, authorize(PERMISSIONS.STUDENT_UPDATE), updateLeaveStatus);

export default router;
