import { Request, Response, NextFunction } from 'express';
import { FeeService } from '../services/FeeService';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';
import { getSchoolScope } from '../utils/schoolScope';
import { requireFields, requirePositiveNumber, VALID_PAYMENT_MODES } from '../utils/validate';

// ── Fee Structures ─────────────────────────────────────────────────
export const getFeeStructures = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query as Record<string, string>;
    
    const scope = getSchoolScope(req);
    const structures = await (prisma.feeStructure as any).findMany({
      where: {
        ...(classId ? { 
          OR: [
            { classId: classId },
            { classId: null }
          ]
        } : {}),
        ...scope
      },
      include: {
        class: { select: { id: true, name: true, numericValue: true } },
        academicYear: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Found structures:', structures.length);

    res.json({ success: true, data: structures });
  } catch (error) { next(error); }
};

export const createFeeStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, class: classId, components } = req.body;
    
    // Required: name and components
    const fieldErr = requireFields(req.body, ['name']);
    if (fieldErr) return next(fieldErr);

    if (!components || !Array.isArray(components) || components.length === 0) {
      return next(createError('At least one fee component is required.', 400));
    }

    // Each component amount must be > 0
    for (const comp of components) {
      const amtErr = requirePositiveNumber(comp.amount, `Component "${comp.name || 'unnamed'}" amount`);
      if (amtErr) return next(amtErr);
    }

    const academicYear = await prisma.academicYear.findFirst({ 
      where: { isCurrent: true, ...getSchoolScope(req) } 
    });
    if (!academicYear) { next(createError('No active academic year found', 400)); return; }

    const totalAmount = (components as any[]).reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const structure = await (prisma.feeStructure as any).create({
      data: {
        name,
        classId: classId === 'all' ? null : classId,
        academicYearId: academicYear.id,
        components,
        totalAmount,
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      },
      include: { class: { select: { name: true } } }
    });

    res.status(201).json({ success: true, message: 'Fee structure created', data: structure });
  } catch (error) { next(error); }
};

export const updateFeeStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, class: classId, components } = req.body;
    const totalAmount = (components as any[]).reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const structure = await (prisma.feeStructure as any).update({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data: {
        name,
        classId: classId === 'all' ? null : classId,
        components,
        totalAmount,
      },
      include: { class: { select: { name: true } } }
    });

    res.json({ success: true, message: 'Fee structure updated', data: structure });
  } catch (error) { next(error); }
};

export const deleteFeeStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.feeStructure.delete({ 
      where: { id: req.params.id as string, ...getSchoolScope(req) } 
    });
    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (error) { next(error); }
};

// ── Student Fee Status ─────────────────────────────────────────────
export const getStudentFeeStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId } = req.params;
    const user = req.user!;

    // Security Check
    if (user.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id as string },
        include: { children: { select: { id: true } } }
      });
      if (!parent || !parent.children.some(child => child.id === studentId)) {
        next(createError('Access denied. This student is not linked to your account.', 403));
        return;
      }
    } else if (user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id as string }
      });
      if (!student || student.id !== studentId) {
        next(createError('Access denied. You can only view your own fees.', 403));
        return;
      }
    }

    const data = await FeeService.getStudentLedger(studentId as string);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ── Collect Fee ────────────────────────────────────────────────────
export const collectFee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate paymentMode before delegating to FeeService
    const { paymentMode, amountPaid } = req.body;
    if (paymentMode && !(VALID_PAYMENT_MODES as readonly string[]).includes(paymentMode)) {
      return next(createError(
        `Invalid payment mode "${paymentMode}". Allowed: ${VALID_PAYMENT_MODES.join(', ')}.`,
        400
      ));
    }

    // Student school-scope check (FeeService also validates, but catch early)
    const schoolId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    if (req.body.studentId && req.user?.role !== 'super_admin' && schoolId) {
      const student = await prisma.student.findFirst({
        where: { id: req.body.studentId, schoolId }
      });
      if (!student) {
        return next(createError('Student not found in your school.', 404));
      }
    }

    const payment = await FeeService.recordPayment({
      ...req.body,
      collectedBy: req.user!.id as string,
      schoolId
    });
    
    const populated = await prisma.feePayment.findFirst({
      where: { id: payment.id, ...getSchoolScope(req) },
      include: {
        student: { select: { fullName: true, admissionNumber: true } }
      }
    });
    
    res.status(201).json({ success: true, message: 'Fee collected successfully', data: populated });
  } catch (error) { next(error); }
};

// ── Update Fee Payment ─────────────────────────────────────────────
export const updateFeePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amountPaid, remarks } = req.body;
    const payment = await prisma.feePayment.update({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data: { 
        amountPaid: parseFloat(amountPaid), 
        remarks 
      }
    });
    res.json({ success: true, message: 'Payment updated successfully', data: payment });
  } catch (error) { next(error); }
};

// ── Recent Payments ────────────────────────────────────────────────
export const getRecentPayments = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { schoolId } = _req.query as Record<string, string>;
    const payments = await prisma.feePayment.findMany({
      where: {
        ...getSchoolScope(_req),
        ...(schoolId && _req.user?.role === 'super_admin' ? { schoolId } : {})
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true, class: { select: { name: true } } } },
        school: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: payments });
  } catch (error) { next(error); }
};

// ── All Payments for a Student ─────────────────────────────────────
export const getStudentPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId } = req.params;
    const user = req.user!;

    // RBAC: parents can only view payments of linked children
    if (user.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id as string },
        include: { children: { select: { id: true } } }
      });
      if (!parent || !parent.children.some(child => child.id === studentId)) {
        next(createError('Access denied. This student is not linked to your account.', 403));
        return;
      }
    }
    // RBAC: students can only view their own payments
    else if (user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id as string }
      });
      if (!student || student.id !== studentId) {
        next(createError('Access denied. You can only view your own payment history.', 403));
        return;
      }
    }

    const payments = await prisma.feePayment.findMany({
      where: { studentId: studentId as string, ...getSchoolScope(req) },
      orderBy: { paymentDate: 'desc' }
    });
    res.json({ success: true, data: payments });
  } catch (error) { next(error); }
};

// ── Student Fee Assignments (Admin CRUD) ──────────────────────────
export const addStudentFee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, feeStructureId, customAmount } = req.body;
    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, ...getSchoolScope(req) } });
    const fee = await prisma.studentFee.create({
      data: {
        studentId,
        feeStructureId,
        customAmount: customAmount ? parseFloat(customAmount) : null,
        academicYearId: academicYear?.id || null,
        status: 'pending',
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      },
      include: { feeStructure: { select: { name: true, totalAmount: true } } }
    });
    res.status(201).json({ success: true, message: 'Fee assigned', data: fee });
  } catch (error) { next(error); }
};

export const updateStudentFee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customAmount, status } = req.body;
    const fee = await prisma.studentFee.update({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data: {
        ...(customAmount !== undefined ? { customAmount: parseFloat(customAmount) } : {}),
        ...(status ? { status } : {})
      },
      include: { feeStructure: { select: { name: true, totalAmount: true } } }
    });
    res.json({ success: true, message: 'Fee updated', data: fee });
  } catch (error) { next(error); }
};

export const deleteStudentFee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.studentFee.delete({ 
      where: { id: req.params.id as string, ...getSchoolScope(req) } 
    });
    res.json({ success: true, message: 'Fee assignment removed' });
  } catch (error) { next(error); }
};

export const deleteFeePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.feePayment.delete({ 
      where: { id: req.params.id as string, ...getSchoolScope(req) } 
    });
    res.json({ success: true, message: 'Payment record deleted' });
  } catch (error) { next(error); }
};
