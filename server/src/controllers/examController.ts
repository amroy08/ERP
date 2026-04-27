import { AuthRequest } from "../middleware/authMiddleware";
import { Request, Response, NextFunction } from 'express';
import { ExamService } from '../services/ExamService';
import prisma from '../config/prisma';
import { getSchoolScope } from '../utils/schoolScope';

export const getExams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { classId, academicYearId } = req.query as Record<string, string>;
    const authUser = req.user!;

    const scope = getSchoolScope(req);
    const whereConditions: any[] = [
      scope,
      classId ? { classId } : {},
      academicYearId ? { academicYearId } : {}
    ];

    // Auto-filter for student role
    if (authUser.role === 'student') {
      const student = await prisma.student.findFirst({ where: { userId: authUser.id, ...scope } });
      if (student) {
        whereConditions.push({ classId: student.classId });
      }
    }

    const data = await prisma.exam.findMany({
      where: { AND: whereConditions },
      include: {
        class: { select: { name: true } },
        academicYear: { select: { name: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let { name, type, classId, academicYearId, startDate, endDate, description, fileUrl } = req.body;

    // Resolve current academic year if needed
    if (academicYearId === 'current' || !academicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true, ...getSchoolScope(req) }
      });
      if (currentYear) {
        academicYearId = currentYear.id;
      } else {
        const latestYear = await prisma.academicYear.findFirst({
          where: getSchoolScope(req),
          orderBy: { startDate: 'desc' }
        });
        academicYearId = latestYear?.id;
      }
    }

    if (!academicYearId) {
       return next(new Error('Academic year not found. Please set up academic years first.'));
    }

    const exam = await prisma.exam.create({
      data: {
        name,
        type,
        classId,
        academicYearId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        fileUrl,
        status: 'scheduled',
        schoolId: req.user?.schoolId
      }
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const submitMarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ExamService.submitResults(req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getReportCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ExamService.getStudentReportCard(req.params.studentId as string);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getExamSubjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const exam = await prisma.exam.findFirst({
      where: { id: examId as string, ...getSchoolScope(req) },
      include: { class: true }
    });
    
    if (!exam) return next(new Error('Exam not found'));

    const subjects = await prisma.subject.findMany({
      where: { classId: exam.classId, ...getSchoolScope(req) }
    });
    res.json({ success: true, data: subjects });
  } catch (error) { next(error); }
};

export const getExamMarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId, subjectId } = req.params;
    const results = await prisma.result.findMany({
      where: { examId: examId as string, subjectId: subjectId as string, ...getSchoolScope(req) }
    });
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
};
