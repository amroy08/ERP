import { Router } from 'express';
import {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getStudentFeeStatus,
  collectFee,
  updateFeePayment,
  deleteFeePayment,
  getRecentPayments,
  getStudentPayments,
  addStudentFee,
  updateStudentFee,
  deleteStudentFee,
} from '../controllers/feeController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';
import { checkModuleEnabled } from '../middleware/moduleMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { collectFeeSchema } from '../validation/schemas';

const router = Router();

// Fee Structures (Admin / Accountant can manage)
router.get('/structures', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_VIEW), getFeeStructures);
router.post('/structures', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_CREATE), createFeeStructure);
router.put('/structures/:id', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_CREATE), updateFeeStructure);
router.delete('/structures/:id', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_CREATE), deleteFeeStructure);

// Student fee status and payments
router.get('/status/:studentId', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_VIEW), getStudentFeeStatus);
router.get('/payments/:studentId', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_VIEW), getStudentPayments);

// Collect fee
router.post('/collect', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_COLLECT), validateRequest(collectFeeSchema), collectFee);
router.put('/payment/:id', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_COLLECT), updateFeePayment);
router.delete('/payment/:id', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_COLLECT), deleteFeePayment);

// Student fee assignments (admin CRUD)
router.post('/student-fees', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_CREATE), addStudentFee);
router.put('/student-fees/:id', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_CREATE), updateStudentFee);
router.delete('/student-fees/:id', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_CREATE), deleteStudentFee);

// Recent payments (for dashboard)
router.get('/recent', protect, checkModuleEnabled('fees'), authorize(PERMISSIONS.FEE_VIEW), getRecentPayments);

export default router;
