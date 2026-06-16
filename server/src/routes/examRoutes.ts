import { Router } from 'express';
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  submitMarks,
  getExamMarks,
  getExamSubjects,
  getReportCard,
  getExamGradebook,
  getEnrichedExamMarks,
  saveStudentMark,
  getStudentResults,
  getParentStudentResults
} from '../controllers/examController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';
import { checkModuleEnabled } from '../middleware/moduleMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { submitResultsSchema } from '../validation/schemas';

const router = Router();

// Apply checkModuleEnabled('exams') to all routes in this router
router.use(protect, checkModuleEnabled('exams'));

// Specific routes must come before dynamic routes
router.get('/results/student/:studentId', authorize(PERMISSIONS.EXAM_VIEW), getStudentResults);
router.get('/results/parent/:studentId', authorize(PERMISSIONS.EXAM_VIEW), getParentStudentResults);
router.get('/marks/:examId/:subjectId', authorize(PERMISSIONS.EXAM_MARKS_ENTRY, PERMISSIONS.EXAM_VIEW), getExamMarks);
router.get('/subjects/:examId', authorize(PERMISSIONS.EXAM_MARKS_ENTRY, PERMISSIONS.EXAM_VIEW), getExamSubjects);
router.get('/report/:studentId', authorize(PERMISSIONS.EXAM_VIEW), getReportCard);
router.get('/report-card/:studentId', authorize(PERMISSIONS.EXAM_VIEW), getReportCard);

router.post('/marks', authorize(PERMISSIONS.EXAM_MARKS_ENTRY), submitMarks);
router.post('/submit-results', authorize(PERMISSIONS.EXAM_MARKS_ENTRY), validateRequest(submitResultsSchema), submitMarks);

// Base collection routes
router.get('/', authorize(PERMISSIONS.EXAM_VIEW), getExams);
router.post('/', authorize(PERMISSIONS.EXAM_CREATE), createExam);

// Dynamic routes (registered after specific routes)
router.put('/:id', authorize(PERMISSIONS.EXAM_CREATE), updateExam);
router.delete('/:id', authorize(PERMISSIONS.EXAM_CREATE), deleteExam);

router.get('/:examId/gradebook', authorize(PERMISSIONS.EXAM_VIEW), getExamGradebook);
router.get('/:examId/subjects/:subjectId/marks', authorize(PERMISSIONS.EXAM_MARKS_ENTRY, PERMISSIONS.EXAM_VIEW), getEnrichedExamMarks);
router.post('/:examId/subjects/:subjectId/marks/save', authorize(PERMISSIONS.EXAM_MARKS_ENTRY), saveStudentMark);

export default router;
