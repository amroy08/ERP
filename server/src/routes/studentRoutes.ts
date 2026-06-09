import { Router } from 'express';
import multer from 'multer';
import { 
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  promoteStudent, resetStudentPassword, getStudentActivityLogs, importStudents,
  getStudentEnrollmentHistory
} from '../controllers/studentController';
import {
  uploadStudentDocument,
  downloadStudentDocument,
  deleteStudentDocument
} from '../controllers/studentDocumentController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';
import { studentUpload } from '../middleware/uploadMiddleware';

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
router.get('/:id/enrollment-history', protect, authorize(PERMISSIONS.STUDENT_VIEW), getStudentEnrollmentHistory);

// Student documents management routes
router.post(
  '/:id/documents/:documentType',
  protect,
  authorize(PERMISSIONS.STUDENT_UPDATE),
  studentUpload.single('file'),
  uploadStudentDocument
);

router.get(
  '/:id/documents/:documentType',
  protect,
  authorize(PERMISSIONS.STUDENT_VIEW),
  downloadStudentDocument
);

router.delete(
  '/:id/documents/:documentType',
  protect,
  authorize(PERMISSIONS.STUDENT_UPDATE),
  deleteStudentDocument
);

export default router;
