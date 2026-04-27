import { Router } from 'express';
import multer from 'multer';
import { 
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  promoteStudent, resetStudentPassword, getStudentActivityLogs, importStudents
} from '../controllers/studentController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', protect, authorize(PERMISSIONS.STUDENT_VIEW), getStudents);
router.get('/:id', protect, authorize(PERMISSIONS.STUDENT_VIEW), getStudent);
router.post('/', protect, authorize(PERMISSIONS.STUDENT_CREATE), createStudent);
router.post('/import', protect, authorize(PERMISSIONS.STUDENT_CREATE), upload.single('file'), importStudents);
router.put('/:id', protect, authorize(PERMISSIONS.STUDENT_UPDATE), updateStudent);
router.delete('/:id', protect, authorize(PERMISSIONS.STUDENT_DELETE), deleteStudent);
router.post('/:id/promote', protect, authorize(PERMISSIONS.STUDENT_UPDATE), promoteStudent);
router.post('/:id/reset-password', protect, authorize(PERMISSIONS.STUDENT_UPDATE), resetStudentPassword);
router.get('/:id/logs', protect, authorize(PERMISSIONS.STUDENT_VIEW), getStudentActivityLogs);

export default router;
