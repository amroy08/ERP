import { AuthRequest } from "../middleware/authMiddleware";
import { Request, Response, NextFunction } from 'express';
import { ExamService } from '../services/ExamService';
import { NotificationService } from '../services/NotificationService';
import prisma from '../config/prisma';
import { getSchoolScope } from '../utils/schoolScope';
import { createError } from '../middleware/errorHandler';
import { requireValidMarks } from '../utils/validate';

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
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      }
    });

    NotificationService.notifyExamScheduled(exam).catch((error) => {
      console.error('Exam scheduled email notification failed:', error);
    });

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const submitMarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    const data = await ExamService.submitResults(req.body, schoolId);

    NotificationService.notifyResultPublished({
      examId: req.body.examId,
      subjectId: req.body.subjectId,
      results: data,
      schoolId
    }).catch((error) => {
      console.error('Result published email notification failed:', error);
    });

    res.json({ success: true, data: data });
  } catch (error) {
    next(error);
  }
};

export const getReportCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.studentId as string;
    const authUser = req.user!;

    // Enforce role-based scoping checks for student and parent
    if (authUser.role === 'student') {
      const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
      if (!student || student.id !== studentId) {
        return next(createError('Access denied. You can only view your own report card.', 403));
      }
    } else if (authUser.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { userId: authUser.id },
        include: { children: { select: { id: true } } }
      });
      if (!parent || !parent.children.some(child => child.id === studentId)) {
        return next(createError('Access denied. This student is not linked to your account.', 403));
      }
    } else {
      // For staff roles, ensure student belongs to the same school
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || (req.user?.schoolId && student.schoolId !== req.user.schoolId)) {
        return next(createError('Access denied. Student not found in your school.', 403));
      }
    }

    const data = await ExamService.getStudentReportCard(studentId as string);
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

    const authUser = req.user!;
    let subjects;
    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: authUser.id } });
      if (!teacher) return next(createError('Teacher profile not found.', 404));
      subjects = await prisma.subject.findMany({
        where: {
          classId: exam.classId,
          ...getSchoolScope(req),
          OR: [
            { teacherId: teacher.id },
            { subjectTeachers: { some: { teacherId: teacher.id, status: 'active' } } }
          ]
        }
      });
    } else {
      subjects = await prisma.subject.findMany({
        where: { classId: exam.classId, ...getSchoolScope(req) }
      });
    }
    res.json({ success: true, data: subjects });
  } catch (error) { next(error); }
};

export const getExamMarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId, subjectId } = req.params;
    const authUser = req.user!;
    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: authUser.id } });
      if (!teacher) return next(createError('Teacher profile not found.', 404));
      const isAssigned = await prisma.subject.findFirst({
        where: {
          id: subjectId as string,
          OR: [
            { teacherId: teacher.id },
            { subjectTeachers: { some: { teacherId: teacher.id, status: 'active' } } }
          ]
        }
      });
      if (!isAssigned) {
        return next(createError('Access denied. You are not assigned to this subject.', 403));
      }
    }

    const results = await prisma.result.findMany({
      where: { examId: examId as string, subjectId: subjectId as string, ...getSchoolScope(req) }
    });
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
};

export const updateExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, classId, startDate, endDate, description, status } = req.body;

    const exam = await prisma.exam.findFirst({
      where: { id: id as string, ...getSchoolScope(req) }
    });
    if (!exam) return next(createError('Exam not found', 404));

    const updated = await prisma.exam.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(classId && { classId }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      }
    });

    const oldStart = exam.startDate.getTime();
    const oldEnd = exam.endDate.getTime();
    const newStart = startDate ? new Date(startDate).getTime() : oldStart;
    const newEnd = endDate ? new Date(endDate).getTime() : oldEnd;

    if (oldStart !== newStart || oldEnd !== newEnd) {
      NotificationService.notifyExamDateChanged(exam, updated).catch((error) => {
        console.error('Exam date changed email notification failed:', error);
      });
    }

    if (updated.status === 'published' && exam.status !== 'published') {
      NotificationService.notifyExamScheduled(updated).catch((error) => {
        console.error('Exam published email notification failed:', error);
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findFirst({
      where: { id: id as string, ...getSchoolScope(req) }
    });
    if (!exam) return next(createError('Exam not found', 404));

    // Delete associated results first, then the exam
    await prisma.$transaction([
      prisma.result.deleteMany({ where: { examId: id as string } }),
      prisma.exam.delete({ where: { id: id as string } })
    ]);

    res.json({ success: true, message: `Exam "${exam.name}" deleted successfully` });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.2C helpers
// ─────────────────────────────────────────────────────────────────────────────
const getSid = (req: AuthRequest): string | undefined => {
  const sid = req.user?.schoolId;
  return typeof sid === 'string' && sid.length > 0 ? sid : undefined;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sidWhere = (sid: string | undefined): any => (sid ? { schoolId: sid } : {});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.2C: Gradebook summary — per exam, all subjects, with entry counts
// GET /api/exams/:examId/gradebook
// ─────────────────────────────────────────────────────────────────────────────
export const getExamGradebook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const schoolId = getSid(req);

    // Students and parents cannot access the gradebook (staff/admin/teacher only)
    const role = req.user?.role;
    if (role === 'student' || role === 'parent') {
      return next(createError('Access denied. Gradebook is for staff/admin/teacher only.', 403));
    }

    const exam = await prisma.exam.findFirst({
      where: { id: examId, ...sidWhere(schoolId) },
      include: {
        class: { select: { id: true, name: true } }
      }
    });
    if (!exam) return next(createError('Exam not found', 404));

    // Get all subjects for the exam's class (scoped for teachers)
    const authUser = req.user!;
    let subjects;
    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: authUser.id } });
      if (!teacher) return next(createError('Teacher profile not found.', 404));
      subjects = await prisma.subject.findMany({
        where: {
          classId: exam.classId,
          ...sidWhere(schoolId),
          OR: [
            { teacherId: teacher.id },
            { subjectTeachers: { some: { teacherId: teacher.id, status: 'active' } } }
          ]
        },
        include: { teacher: { include: { user: { select: { name: true } } } } }
      });
    } else {
      subjects = await prisma.subject.findMany({
        where: { classId: exam.classId, ...sidWhere(schoolId) },
        include: { teacher: { include: { user: { select: { name: true } } } } }
      });
    }

    // Total students in the exam's class
    const totalStudents = await prisma.student.count({
      where: { classId: exam.classId, ...sidWhere(schoolId) }
    });

    // For each subject get result counts
    const gradebook = await Promise.all(subjects.map(async (subject) => {
      const results = await prisma.result.findMany({
        where: { examId, subjectId: subject.id, ...sidWhere(schoolId) },
        select: { marksObtained: true, maxMarks: true }
      });
      const entered = results.length;
      const maxMarksVal = results[0]?.maxMarks ?? 100;
      const avgMarks = entered > 0 ? Math.round(results.reduce((acc, r) => acc + r.marksObtained, 0) / entered) : null;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        teacherName: (subject.teacher as any)?.user?.name ?? null,
        totalStudents,
        marksEnteredCount: entered,
        pendingMarksCount: totalStudents - entered,
        maxMarks: maxMarksVal,
        averageMarks: avgMarks
      };
    }));

    res.json({
      success: true,
      data: {
        examId: exam.id,
        examName: exam.name,
        examType: exam.type,
        classId: exam.classId,
        className: (exam as any).class?.name ?? null,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
        totalStudents,
        subjects: gradebook
      }
    });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.2C: Enriched marks — student name, admNo, percentage, grade
// GET /api/exams/:examId/subjects/:subjectId/marks
// ─────────────────────────────────────────────────────────────────────────────
export const getEnrichedExamMarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId, subjectId } = req.params;
    const { search } = req.query as Record<string, string>;
    const schoolId = getSid(req);

    const exam = await prisma.exam.findFirst({ where: { id: examId, ...sidWhere(schoolId) } });
    if (!exam) return next(createError('Exam not found', 404));

    // Security: Check subject-level authorization if teacher
    const authUser = req.user!;
    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: authUser.id } });
      if (!teacher) return next(createError('Teacher profile not found.', 404));
      const isAssigned = await prisma.subject.findFirst({
        where: {
          id: subjectId as string,
          OR: [
            { teacherId: teacher.id },
            { subjectTeachers: { some: { teacherId: teacher.id, status: 'active' } } }
          ]
        }
      });
      if (!isAssigned) {
        return next(createError('Access denied. You are not assigned to this subject.', 403));
      }
    }

    // All students in class
    const allStudents = await prisma.student.findMany({
      where: {
        classId: exam.classId,
        ...sidWhere(schoolId),
        ...(search ? { fullName: { contains: search } } : {})
      },
      include: { section: { select: { name: true } } },
      orderBy: { rollNumber: 'asc' }
    });

    // Existing results
    const results = await prisma.result.findMany({
      where: { examId, subjectId, ...sidWhere(schoolId) }
    });
    const resultMap = new Map(results.map(r => [r.studentId, r]));

    const rows = allStudents.map(student => {
      const result = resultMap.get(student.id);
      const maxMarks = result?.maxMarks ?? 100;
      const marks = result?.marksObtained ?? null;
      const percentage = marks !== null ? Math.round((marks / maxMarks) * 100) : null;

      let grade: string | null = null;
      if (percentage !== null) {
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else grade = 'F';
      }

      return {
        studentId: student.id,
        studentName: student.fullName,
        admissionNo: student.admissionNumber,
        rollNumber: student.rollNumber,
        sectionName: student.section?.name ?? null,
        resultId: result?.id ?? null,
        marksObtained: marks,
        maxMarks,
        percentage,
        grade,
        remark: result?.remark ?? null,
        updatedAt: result?.updatedAt ?? null,
        status: result ? 'entered' : 'pending'
      };
    });

    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.2C: Save/update single student marks (web inline edit)
// POST /api/exams/:examId/subjects/:subjectId/marks/save
// ─────────────────────────────────────────────────────────────────────────────
export const saveStudentMark = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.examId as string;
    const subjectId = req.params.subjectId as string;
    const { studentId, marksObtained, maxMarks: maxMarksRaw, remark } = req.body;
    const schoolId = getSid(req);

    if (!studentId) return next(createError('studentId is required', 400));

    const maxMarksVal = parseInt(maxMarksRaw ?? '100', 10) || 100;
    const marksVal = parseInt(marksObtained ?? '0', 10);

    const marksErr = requireValidMarks(marksObtained, maxMarksVal);
    if (marksErr) return next(createError(marksErr.message, 400));

    // Ensure exam + student belong to same school/class
    const exam = await prisma.exam.findFirst({ where: { id: examId, ...sidWhere(schoolId) } });
    if (!exam) return next(createError('Exam not found', 404));

    // Security: Check subject-level authorization if teacher
    const authUser = req.user!;
    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: authUser.id } });
      if (!teacher) return next(createError('Teacher profile not found.', 404));
      const isAssigned = await prisma.subject.findFirst({
        where: {
          id: subjectId as string,
          OR: [
            { teacherId: teacher.id },
            { subjectTeachers: { some: { teacherId: teacher.id, status: 'active' } } }
          ]
        }
      });
      if (!isAssigned) {
        return next(createError('Access denied. You are not assigned to this subject.', 403));
      }
    }

    const student = await prisma.student.findFirst({ where: { id: studentId, classId: exam.classId, ...sidWhere(schoolId) } });
    if (!student) return next(createError('Student not found in this exam class', 404));

    // Grade calculation
    const percentage = Math.round((marksVal / maxMarksVal) * 100);
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const result = await prisma.result.upsert({
      where: { examId_studentId_subjectId: { examId, studentId, subjectId } },
      update: { marksObtained: marksVal, maxMarks: maxMarksVal, grade, remark: remark ?? '' },
      create: { examId, studentId, subjectId, marksObtained: marksVal, maxMarks: maxMarksVal, grade, remark: remark ?? '', ...sidWhere(schoolId) }
    });

    NotificationService.notifyResultPublished({
      examId,
      subjectId,
      results: [result],
      schoolId: schoolId || undefined,
    }).catch((error) => {
      console.error('Marks save single student notification failed:', error);
    });

    res.json({ success: true, message: 'Marks saved successfully', data: {
      ...result,
      percentage,
      grade
    }});
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.2C: Student result endpoint (own results only, or admin)
// GET /api/exams/results/student/:studentId
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query as Record<string, string>;
    const authUser = req.user!;
    const schoolId = getSid(req);

    // RBAC: student can only view own results
    if (authUser.role === 'student') {
      const student = await prisma.student.findFirst({ where: { userId: authUser.id, ...sidWhere(schoolId) } });
      if (!student || student.id !== studentId) return next(createError('Access denied.', 403));
    } else if (authUser.role === 'parent') {
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.id },
        include: { children: { select: { id: true } } }
      });
      if (!parent || !parent.children.some(c => c.id === studentId)) return next(createError('Access denied. Student not linked to your account.', 403));
    } else {
      // Admin/teacher/staff — verify same school
      const student = await prisma.student.findFirst({ where: { id: studentId, ...sidWhere(schoolId) } });
      if (!student) return next(createError('Student not found', 404));
    }

    const results = await prisma.result.findMany({
      where: { studentId, ...(examId ? { examId } : {}), ...sidWhere(schoolId) },
      include: {
        exam: { select: { id: true, name: true, type: true, startDate: true } },
        subject: { select: { id: true, name: true, code: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const enriched = results.map(r => {
      const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
      let grade = 'F';
      if (pct >= 90) grade = 'A+'; else if (pct >= 80) grade = 'A'; else if (pct >= 70) grade = 'B'; else if (pct >= 60) grade = 'C'; else if (pct >= 50) grade = 'D';
      return { ...r, percentage: pct, grade: r.grade ?? grade };
    });

    res.json({ success: true, data: enriched });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.2C: Parent result endpoint (linked child only)
// GET /api/exams/results/parent/:studentId
// ─────────────────────────────────────────────────────────────────────────────
export const getParentStudentResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query as Record<string, string>;
    const authUser = req.user!;
    const schoolId = getSid(req);

    if (authUser.role === 'parent') {
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.id },
        include: { children: { select: { id: true } } }
      });
      if (!parent || !parent.children.some(c => c.id === studentId)) return next(createError('Access denied.', 403));
    } else if (authUser.role === 'student') {
      return next(createError('Access denied.', 403));
    } else {
      const student = await prisma.student.findFirst({ where: { id: studentId, ...sidWhere(schoolId) } });
      if (!student) return next(createError('Student not found', 404));
    }

    const results = await prisma.result.findMany({
      where: { studentId, ...(examId ? { examId } : {}), ...sidWhere(schoolId) },
      include: {
        exam: { select: { id: true, name: true, type: true, startDate: true } },
        subject: { select: { id: true, name: true, code: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const enriched = results.map(r => {
      const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
      let grade = 'F';
      if (pct >= 90) grade = 'A+'; else if (pct >= 80) grade = 'A'; else if (pct >= 70) grade = 'B'; else if (pct >= 60) grade = 'C'; else if (pct >= 50) grade = 'D';
      return { ...r, percentage: pct, grade: r.grade ?? grade };
    });

    res.json({ success: true, data: enriched });
  } catch (error) { next(error); }
};
