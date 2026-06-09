import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  registerDevice,
  unregisterDevice,
  getParentDashboard,
  getParentStudentProfile,
  getStudentDashboard,
  getTeacherDashboard,
  getTeacherTimetable
} from '../controllers/mobileController';

const router = Router();

// Apply auth middleware to protect all mobile routes
router.use(protect);

// Device token endpoints
router.post('/devices/register', registerDevice);
router.post('/devices/unregister', unregisterDevice);

// Parent dashboard endpoints
router.get('/parent/dashboard', getParentDashboard);
router.get('/parent/student-profile/:studentId', getParentStudentProfile);

// Student dashboard endpoints
router.get('/student/dashboard', getStudentDashboard);

// Teacher dashboard endpoints
router.get('/teacher/dashboard', getTeacherDashboard);
router.get('/teacher/timetable', getTeacherTimetable);

export default router;
