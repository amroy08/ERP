import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSchoolScope } from '../utils/schoolScope';

export const getStudentLeaves = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId: req.params.studentId as string, ...getSchoolScope(req) },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: leaves });
  } catch (error) { next(error); }
};

export const createLeaveRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, type, startDate, endDate, reason } = req.body;
    const authUser = req.user!;

    // Access control: Students can only request leave for themselves, Parents for their children
    if (authUser.role === 'student') {
      const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
      if (!student || student.id !== studentId) {
        next(createError('Access denied. You can only request leave for yourself.', 403));
        return;
      }
    } else if (authUser.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { userId: authUser.id },
        include: { children: { select: { id: true } } }
      });
      if (!parent || !parent.children.some(c => c.id === studentId)) {
        next(createError('Access denied. You can only request leave for your own children.', 403));
        return;
      }
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        studentId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'pending',
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      }
    });

    res.status(201).json({ success: true, message: 'Leave request submitted', data: leave });
  } catch (error) { next(error); }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, remarks } = req.body;
    const leave = await prisma.leaveRequest.update({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data: { 
        status, 
        remarks,
        approvedBy: req.user?.id as string
      }
    });

    res.json({ success: true, message: `Leave ${status}`, data: leave });
  } catch (error) { next(error); }
};
