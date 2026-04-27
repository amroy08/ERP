import { Router } from 'express';
import { getExams, createExam, submitMarks, getReportCard } from '../controllers/examController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';
import { checkModuleEnabled } from '../middleware/moduleMiddleware';

import { validateRequest } from '../middleware/validateMiddleware';
import { submitResultsSchema } from '../validation/schemas';

const router = Router();

router.get('/', protect, checkModuleEnabled('exams'), authorize(PERMISSIONS.EXAM_VIEW), getExams);
router.post('/', protect, checkModuleEnabled('exams'), authorize(PERMISSIONS.EXAM_CREATE), createExam);
router.post('/submit-results', protect, checkModuleEnabled('exams'), authorize(PERMISSIONS.EXAM_MARKS_ENTRY), validateRequest(submitResultsSchema), submitMarks);
router.get('/report-card/:studentId', protect, checkModuleEnabled('exams'), authorize(PERMISSIONS.EXAM_VIEW), getReportCard);

export default router;
