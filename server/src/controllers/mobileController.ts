import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';
import { FeeService } from '../services/FeeService';
import { ExamService } from '../services/ExamService';
import { PushNotificationService } from '../services/PushNotificationService';

// ── Helper to calculate attendance stats ──
const calculateAttendanceSummary = (records: any[]) => {
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, late, percentage };
};

// ── Device Registration Endpoints ──────────────────────────────────────────

export const registerDevice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, deviceType, platform, appVersion } = req.body;
    const authUser = req.user!;

    if (!token) {
      return next(createError('Device token is required.', 400));
    }
    // Accept 'ios', 'android', and optionally 'web' (for web testing/development metadata).
    // Note: Native web push notifications require separate Firebase Web SDK / VAPID setup.
    if (deviceType !== 'ios' && deviceType !== 'android' && deviceType !== 'web') {
      return next(createError('Invalid deviceType. Must be "ios", "android", or "web".', 400));
    }

    // Upsert by token to safely reassign if it belonged to another user previously
    const deviceTokenObj = await prisma.deviceToken.upsert({
      where: { token },
      create: {
        token,
        userId: authUser.id,
        deviceType,
        platform: platform || null,
        appVersion: appVersion || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        userId: authUser.id,
        deviceType,
        platform: platform || null,
        appVersion: appVersion || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    // Do not echo back the raw token — return only safe metadata fields
    res.status(200).json({
      success: true,
      message: 'Device registered successfully.',
      data: {
        id: deviceTokenObj.id,
        deviceType: deviceTokenObj.deviceType,
        platform: deviceTokenObj.platform,
        appVersion: deviceTokenObj.appVersion,
        isActive: deviceTokenObj.isActive,
        lastSeenAt: deviceTokenObj.lastSeenAt,
        createdAt: deviceTokenObj.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const unregisterDevice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    const authUser = req.user!;

    if (!token) {
      return next(createError('Device token is required.', 400));
    }

    const deviceTokenRecord = await prisma.deviceToken.findUnique({
      where: { token },
    });

    if (!deviceTokenRecord || deviceTokenRecord.userId !== authUser.id) {
      return next(createError('Token not associated with authenticated user.', 403));
    }

    const updated = await prisma.deviceToken.update({
      where: { token },
      data: {
        isActive: false,
        lastSeenAt: new Date(),
      },
    });

    // Do not echo back the raw token — return only safe metadata fields
    res.status(200).json({
      success: true,
      message: 'Device unregistered successfully.',
      data: {
        id: updated.id,
        deviceType: updated.deviceType,
        isActive: updated.isActive,
        lastSeenAt: updated.lastSeenAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Parent Dashboard Endpoint ──────────────────────────────────────────────

export const getParentDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'parent') {
      return next(createError('Access denied. Role "parent" required.', 403));
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: authUser.id },
      include: {
        children: {
          where: { status: 'active' },
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!parent) {
      res.status(200).json({ success: true, children: [], summary: { totalChildren: 0, totalPendingFees: 0, unreadNotices: 0, upcomingExamsCount: 0 } });
      return;
    }

    const childrenData = [];
    let totalPendingFees = 0;

    // Fetch notices targeting parent or all
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        schoolId: authUser.schoolId,
        OR: [
          { targetRoles: { contains: 'all' } },
          { targetRoles: { contains: 'parent' } },
        ],
      },
      orderBy: { publishDate: 'desc' },
      take: 5,
    });

    for (const child of parent.children) {
      // 1. Attendance Summary
      const attendanceRecords = await prisma.attendance.findMany({
        where: { studentId: child.id },
        orderBy: { date: 'desc' },
        take: 30,
      });
      const attendanceSummary = calculateAttendanceSummary(attendanceRecords);

      // 2. Pending Fees
      let balanceDue = 0;
      try {
        const ledger = await FeeService.getStudentLedger(child.id);
        balanceDue = ledger?.balanceDue || 0;
      } catch (err) {
        console.error(`[MobileController] Error fetching ledger for child ${child.id}:`, err);
      }
      totalPendingFees += balanceDue;

      // 3. Recent Homework
      const homework = await prisma.homework.findMany({
        where: {
          classId: child.classId,
          OR: [{ sectionId: child.sectionId }, { sectionId: null }],
        },
        include: { subject: { select: { name: true } } },
        orderBy: { assignedDate: 'desc' },
        take: 3,
      });

      const recentHomework = homework.map(h => ({
        id: h.id,
        title: h.title,
        subjectName: h.subject.name,
        dueDate: h.dueDate,
      }));

      // 4. Upcoming Exams
      const exams = await prisma.exam.findMany({
        where: {
          classId: child.classId,
          startDate: { gte: new Date() },
          status: 'scheduled',
        },
        orderBy: { startDate: 'asc' },
        take: 3,
      });

      const upcomingExams = exams.map(e => ({
        id: e.id,
        name: e.name,
        startDate: e.startDate,
      }));

      // A. Count pending homework
      const pendingHomeworkCount = await prisma.homework.count({
        where: {
          classId: child.classId,
          OR: [{ sectionId: child.sectionId }, { sectionId: null }],
          dueDate: { gte: new Date() },
          submissions: {
            none: { studentId: child.id },
          },
        },
      });

      // B. Count today's timetable periods
      const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as any;
      const todayPeriodsCount = await prisma.timetableEntry.count({
        where: {
          timetable: { classId: child.classId, sectionId: child.sectionId || undefined, isActive: true },
          day: todayDay
        }
      });

      // C. Get latest result summary
      const latestResult = await prisma.result.findFirst({
        where: { studentId: child.id },
        include: {
          exam: { select: { name: true } },
          subject: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      let latestResultSummary = null;
      if (latestResult) {
        const total = latestResult.maxMarks ?? 100;
        const obtained = latestResult.marksObtained ?? 0;
        const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;
        latestResultSummary = `${pct}% in ${latestResult.subject?.name || 'Subject'} (${latestResult.exam?.name || 'Exam'})`;
      }

      childrenData.push({
        id: child.id,
        name: child.fullName,
        admissionNo: child.admissionNumber,
        className: child.class.name,
        sectionName: child.section?.name || 'N/A',
        attendanceSummary,
        pendingFees: balanceDue,
        recentHomework,
        upcomingExams,
        todayPeriodsCount,
        pendingHomeworkCount,
        upcomingExamsCount: exams.length,
        latestResultSummary,
        latestNotices: notices.map(n => ({
          id: n.id,
          title: n.title,
          publishDate: n.publishDate,
          priority: n.priority,
        })),
      });
    }

    // Get unread/active notices count
    const totalNoticesCount = await prisma.notice.count({
      where: {
        isPublished: true,
        schoolId: authUser.schoolId,
        OR: [
          { targetRoles: { contains: 'all' } },
          { targetRoles: { contains: 'parent' } },
        ],
      },
    });

    const upcomingExamsCount = childrenData.reduce((acc, child) => acc + child.upcomingExams.length, 0);

    res.status(200).json({
      success: true,
      data: {
        children: childrenData,
        summary: {
          totalChildren: childrenData.length,
          totalPendingFees,
          unreadNotices: totalNoticesCount,
          upcomingExamsCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Parent Linked Student Helper ───────────────────────────────────────────
const getParentLinkedStudentOrThrow = async (authUser: any, studentId: string) => {
  if (authUser.role !== 'parent') {
    throw createError('Access denied. Role "parent" required.', 403);
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: authUser.id },
    include: {
      children: {
        where: { id: studentId, status: 'active' },
      },
    },
  });

  if (!parent || parent.children.length === 0) {
    throw createError('Access denied. This student is not linked to your account.', 403);
  }

  const child = parent.children[0];
  if (child.schoolId && authUser.schoolId && child.schoolId !== authUser.schoolId) {
    throw createError('Access denied. School mismatch.', 403);
  }

  return child;
};

// ── Parent Student Profile Endpoint ────────────────────────────────────────

export const getParentStudentProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const authUser = req.user!;

    if (authUser.role !== 'parent') {
      return next(createError('Access denied. Role "parent" required.', 403));
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: authUser.id },
      include: { children: { select: { id: true } } },
    });

    if (!parent || !parent.children.some(child => child.id === studentId)) {
      return next(createError('Access denied. This student is not linked to your account.', 403));
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        section: true,
        parent: true,
      },
    });

    if (!student) {
      return next(createError('Student not found.', 404));
    }

    // 1. Attendance
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 50,
    });
    const attendanceSummary = calculateAttendanceSummary(attendanceRecords);

    // 2. Fees Status & Ledger
    let feeStatus = null;
    let recentPayments: any[] = [];
    try {
      feeStatus = await FeeService.getStudentLedger(studentId);
      recentPayments = await prisma.feePayment.findMany({
        where: { studentId },
        orderBy: { paymentDate: 'desc' },
        take: 10,
      });
    } catch (err) {
      console.error('[MobileController] Fee ledger error:', err);
    }

    // 3. Homework
    const homework = await prisma.homework.findMany({
      where: {
        classId: (student as any).classId,
        OR: [{ sectionId: (student as any).sectionId }, { sectionId: null }],
      },
      include: { subject: { select: { name: true } } },
      orderBy: { assignedDate: 'desc' },
      take: 20,
    });

    // 4. Timetable
    const timetable = await prisma.timetable.findFirst({
      where: {
        classId: (student as any).classId,
        sectionId: (student as any).sectionId || undefined,
        isActive: true,
      },
      include: {
        entries: {
          include: {
            subject: { select: { name: true } },
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    // 5. Exams
    const exams = await prisma.exam.findMany({
      where: { classId: (student as any).classId },
      orderBy: { startDate: 'desc' },
    });

    // 6. Report Cards
    let reportCards = null;
    try {
      reportCards = await ExamService.getStudentReportCard(studentId);
    } catch (err) {
      console.error('[MobileController] Report cards error:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
        },
        class: (student as any).class,
        section: (student as any).section,
        attendanceSummary,
        recentAttendance: attendanceRecords,
        feeStatus,
        recentPayments,
        homework,
        timetable,
        exams,
        reportCards,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ── Student Dashboard Endpoint ─────────────────────────────────────────────

export const getStudentDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'student') {
      return next(createError('Access denied. Role "student" required.', 403));
    }

    const student = await prisma.student.findUnique({
      where: { userId: authUser.id },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      return next(createError('Student profile not found.', 404));
    }

    // 1. Attendance Summary
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      take: 30,
    });
    const attendanceSummary = calculateAttendanceSummary(attendanceRecords);

    // 2. Today's Timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    const timetable = await prisma.timetable.findFirst({
      where: {
        classId: student.classId,
        sectionId: student.sectionId || undefined,
        isActive: true,
      },
      include: {
        entries: {
          where: { day: currentDay },
          include: {
            subject: { select: { name: true } },
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
    const todayTimetable = timetable?.entries.sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];

    // 3. Pending Homework
    const homework = await prisma.homework.findMany({
      where: {
        classId: student.classId,
        OR: [{ sectionId: student.sectionId }, { sectionId: null }],
        dueDate: { gte: new Date() },
        submissions: {
          none: { studentId: student.id },
        },
      },
      include: { subject: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    // 4. Notices
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        schoolId: authUser.schoolId,
        OR: [
          { targetRoles: { contains: 'all' } },
          { targetRoles: { contains: 'student' } },
        ],
      },
      orderBy: { publishDate: 'desc' },
      take: 5,
    });

    // 5. Upcoming Exams
    const exams = await prisma.exam.findMany({
      where: {
        classId: student.classId,
        startDate: { gte: new Date() },
        status: 'scheduled',
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    // 6. Fee Summary
    let feeSummary = { totalAssigned: 0, totalPaid: 0, balanceDue: 0 };
    try {
      const ledger = await FeeService.getStudentLedger(student.id);
      feeSummary = {
        totalAssigned: (ledger as any)?.totalFee || 0,
        totalPaid: (ledger as any)?.paidAmount || 0,
        balanceDue: ledger?.balanceDue || 0,
      };
    } catch (err) {
      console.error('[MobileController] Student ledger error:', err);
    }

    // 7. Latest Result / Report Card
    let latestResult = null;
    try {
      const resultsReport = await ExamService.getStudentReportCard(student.id);
      latestResult = resultsReport || null;
    } catch (err) {
      console.error('[MobileController] Student latest results error:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          className: student.class.name,
          sectionName: student.section?.name || 'N/A',
        },
        todayTimetable,
        attendanceSummary,
        pendingHomework: homework,
        notices,
        upcomingExams: exams,
        feeSummary,
        latestResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Teacher Dashboard Endpoint ─────────────────────────────────────────────

export const getTeacherDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'teacher') {
      return next(createError('Access denied. Role "teacher" required.', 403));
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: authUser.id },
      include: {
        assignedClasses: true,
        classTeacherOf: {
          include: {
            class: true,
          },
        },
        subjectTeachers: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
        },
      },
    });

    if (!teacher) {
      return next(createError('Teacher profile not found.', 404));
    }

    // Today's schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    const timetableEntries = await prisma.timetableEntry.findMany({
      where: {
        teacherId: teacher.id,
        day: currentDay,
        timetable: { isActive: true },
      },
      include: {
        subject: { select: { name: true } },
        timetable: {
          include: {
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const todayTimetable = timetableEntries.map(entry => ({
      period: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      className: entry.timetable.class.name,
      sectionName: entry.timetable.section.name,
      subjectName: entry.subject.name,
    }));

    // Classes, Sections, and Subjects assigned from SubjectTeacher mapping
    const classesMap = new Map<string, any>();
    const sectionsMap = new Map<string, any>();
    const subjectsMap = new Map<string, any>();

    // 1. Process from Phase 2.8 SubjectTeacher allocations
    teacher.subjectTeachers.forEach(st => {
      if (st.section && st.section.class) {
        classesMap.set(st.section.class.id, { id: st.section.class.id, name: st.section.class.name });
        sectionsMap.set(st.section.id, { id: st.section.id, name: st.section.name, className: st.section.class.name });
      }
      if (st.subject) {
        subjectsMap.set(st.subject.id, { id: st.subject.id, name: st.subject.name, code: st.subject.code });
      }
    });

    // 2. Add class teacher sections and classes
    teacher.classTeacherOf.forEach(sec => {
      if (sec.class) {
        classesMap.set(sec.class.id, { id: sec.class.id, name: sec.class.name });
        sectionsMap.set(sec.id, { id: sec.id, name: sec.name, className: sec.class.name });
      } else {
        sectionsMap.set(sec.id, { id: sec.id, name: sec.name });
      }
    });
    teacher.assignedClasses.forEach(cls => {
      classesMap.set(cls.id, { id: cls.id, name: cls.name });
    });

    const assignedClasses = Array.from(classesMap.values());
    const assignedSections = Array.from(sectionsMap.values());
    const assignedSubjects = Array.from(subjectsMap.values());

    // 3. Process Pending Attendance
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get sections where attendance has been marked today
    const attendanceToday = await prisma.attendance.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        schoolId: teacher.schoolId,
      },
      select: {
        student: { select: { sectionId: true } },
      },
    });

    const markedSectionIds = new Set(
      attendanceToday.map(a => a.student?.sectionId).filter(Boolean)
    );

    // Filter assigned sections where attendance has NOT been marked today
    const pendingAttendanceClasses = [];
    for (const sec of assignedSections) {
      if (!markedSectionIds.has(sec.id)) {
        // Fetch class detail for this section
        const sectionDetail = await prisma.section.findUnique({
          where: { id: sec.id },
          include: { class: { select: { name: true } } },
        });
        if (sectionDetail) {
          pendingAttendanceClasses.push({
            classId: sectionDetail.classId,
            className: sectionDetail.class.name,
            sectionId: sectionDetail.id,
            sectionName: sectionDetail.name,
          });
        }
      }
    }

    // 4. Recent Homework assigned by this teacher
    const homework = await prisma.homework.findMany({
      where: { assignedById: teacher.id },
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 5. Quick Stats
    // Active students count in classes they teach
    const sectionIds = assignedSections.map(s => s.id);
    const totalStudents = await prisma.student.count({
      where: {
        sectionId: { in: sectionIds },
        status: 'active',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: authUser.name,
          employeeId: teacher.employeeId,
          designation: teacher.designation,
        },
        todayTimetable,
        assignedClasses,
        assignedSections,
        assignedSubjects,
        pendingAttendanceClasses,
        recentHomework: homework,
        quickStats: {
          totalStudents,
          totalSubjects: assignedSubjects.length,
          markedAttendanceToday: pendingAttendanceClasses.length === 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Teacher Timetable Endpoint ─────────────────────────────────────────────

export const getTeacherTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'teacher') {
      return next(createError('Access denied. Role "teacher" required.', 403));
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: authUser.id },
    });

    if (!teacher) {
      return next(createError('Teacher profile not found.', 404));
    }

    const entries = await prisma.timetableEntry.findMany({
      where: {
        teacherId: teacher.id,
        timetable: { isActive: true },
      },
      include: {
        subject: { select: { name: true } },
        timetable: {
          include: {
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    });

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const groupedDaysMap = new Map<string, any[]>();

    daysOrder.forEach(day => groupedDaysMap.set(day, []));

    entries.forEach(entry => {
      const dayList = groupedDaysMap.get(entry.day);
      if (dayList) {
        dayList.push({
          period: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          className: entry.timetable.class.name,
          sectionName: entry.timetable.section.name,
          subjectName: entry.subject.name,
        });
      }
    });

    const daysList = daysOrder.map(day => {
      const sortedPeriods = (groupedDaysMap.get(day) || []).sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
      return {
        day,
        periods: sortedPeriods,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        days: daysList,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Parent Child Academic Endpoints ────────────────────────────────────────

export const getParentChildTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const authUser = req.user!;
    const child = await getParentLinkedStudentOrThrow(authUser, studentId);

    const timetable = await prisma.timetable.findFirst({
      where: { classId: child.classId, sectionId: child.sectionId || undefined, isActive: true },
      include: {
        entries: {
          include: {
            subject: { select: { name: true } },
            teacher: { include: { user: { select: { name: true } } } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    const entries = (timetable?.entries ?? []).map(e => ({
      dayOfWeek: e.day,
      period: (e as any).periodNumber?.toString() ?? '1',
      startTime: e.startTime,
      endTime: e.endTime,
      subjectName: e.subject.name,
      teacherName: e.teacher?.user?.name ?? null,
    }));

    res.status(200).json({ success: true, data: entries });
  } catch (error) { next(error); }
};

export const getParentChildHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const authUser = req.user!;
    const child = await getParentLinkedStudentOrThrow(authUser, studentId);

    const homework = await prisma.homework.findMany({
      where: {
        classId: child.classId,
        OR: [{ sectionId: child.sectionId }, { sectionId: null }],
      },
      include: {
        subject: { select: { name: true } },
        submissions: {
          where: { studentId: child.id },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 30,
    });

    res.status(200).json({
      success: true,
      data: homework.map(h => {
        const sub = h.submissions[0];
        const hasSubmission = !!sub;
        const isPastDue = h.dueDate < new Date();
        const submissionStatus = hasSubmission ? sub.status : (isPastDue ? 'overdue' : 'pending');

        return {
          id: h.id,
          title: h.title,
          description: h.description,
          subjectName: h.subject.name,
          assignedDate: h.assignedDate,
          dueDate: h.dueDate,
          status: hasSubmission ? sub.status : (isPastDue ? 'submitted' : 'pending'),
          submissionStatus,
          submittedAt: sub ? sub.submittedAt : null,
          hasSubmission,
          fileName: sub ? sub.fileName : null,
          teacherFeedback: sub ? sub.teacherFeedback : null,
          marks: sub ? sub.marks : null,
        };
      }),
    });
  } catch (error) { next(error); }
};

export const getParentChildExams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const authUser = req.user!;
    const child = await getParentLinkedStudentOrThrow(authUser, studentId);

    const exams = await prisma.exam.findMany({
      where: { classId: child.classId, startDate: { gte: new Date() }, status: 'scheduled' },
      orderBy: { startDate: 'asc' },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: exams.map(e => ({
        id: e.id, title: e.name, date: e.startDate,
        startTime: null, totalMarks: (e as any).totalMarks ?? 100, subjectName: e.name,
      })),
    });
  } catch (error) { next(error); }
};

export const getParentChildResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const authUser = req.user!;
    const child = await getParentLinkedStudentOrThrow(authUser, studentId);

    const results = await prisma.result.findMany({
      where: { studentId: child.id },
      include: {
        exam: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.status(200).json({
      success: true,
      data: results.map((r: any) => {
        const total = r.maxMarks ?? 100;
        const obtained = r.marksObtained ?? 0;
        return {
          id: r.id,
          examTitle: r.exam?.name ?? 'Exam',
          subjectName: r.subject?.name ?? 'Subject',
          marksObtained: obtained,
          totalMarks: total,
          grade: r.grade ?? null,
          percentage: total > 0 ? Math.round((obtained / total) * 100) : 0,
          status: 'published',
        };
      }),
    });
  } catch (error) { next(error); }
};

// ── Parent Attendance Endpoint ────────────────────────────────────────────

export const getParentAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'parent') return next(createError('Access denied.', 403));

    const parent = await prisma.parent.findUnique({
      where: { userId: authUser.id },
      include: { children: { where: { status: 'active' } } },
    });
    if (!parent) { res.status(200).json({ success: true, data: [] }); return; }

    const result = [];
    for (const child of parent.children) {
      const records = await prisma.attendance.findMany({
        where: { studentId: child.id },
        orderBy: { date: 'desc' },
        take: 60,
      });
      const summary = calculateAttendanceSummary(records);
      result.push({
        studentId: child.id,
        studentName: child.fullName,
        attendancePercent: summary.percentage,
        totalPresent: summary.present,
        totalAbsent: summary.absent,
        totalDays: summary.total,
        records: records.map(r => ({ date: r.date, status: r.status, studentName: child.fullName })),
      });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ── Parent Fees Endpoint ──────────────────────────────────────────────────

export const getParentFees = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'parent') return next(createError('Access denied.', 403));

    const parent = await prisma.parent.findUnique({
      where: { userId: authUser.id },
      include: { children: { where: { status: 'active' } } },
    });
    if (!parent) { res.status(200).json({ success: true, data: [] }); return; }

    const result = [];
    for (const child of parent.children) {
      const studentFees = await prisma.studentFee.findMany({
        where: { studentId: child.id },
        include: { feeStructure: { select: { name: true, totalAmount: true } } },
      });
      // Fetch payments separately since StudentFee has no direct payments relation
      const payments = await prisma.feePayment.findMany({
        where: { studentId: child.id, status: 'completed' },
        select: { amountPaid: true },
      });
      const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

      for (const sf of studentFees) {
        const totalAmount = sf.feeStructure.totalAmount ?? 0;
        const dueAmount = Math.max(0, totalAmount - totalPaid);
        const status =
          dueAmount <= 0 ? 'paid' :
          totalPaid > 0 ? 'partial' : 'unpaid';
        result.push({
          id: sf.id,
          studentName: child.fullName,
          feeStructureName: sf.feeStructure.name,
          totalAmount,
          paidAmount: totalPaid,
          dueAmount,
          dueDate: null,
          status,
        });
      }
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ── Parent Notices Endpoint ───────────────────────────────────────────────

export const getParentNotices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'parent') return next(createError('Access denied.', 403));
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        schoolId: authUser.schoolId,
        OR: [{ targetRoles: { contains: 'all' } }, { targetRoles: { contains: 'parent' } }],
      },
      orderBy: { publishDate: 'desc' },
      take: 30,
    });
    res.status(200).json({
      success: true,
      data: notices.map(n => ({
        id: n.id, title: n.title, content: n.content,
        priority: n.priority, publishDate: n.publishDate, targetAudience: n.targetRoles,
      })),
    });
  } catch (error) { next(error); }
};

// ── Student Timetable Endpoint ────────────────────────────────────────────

export const getStudentTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'student') return next(createError('Access denied.', 403));
    const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
    if (!student) return next(createError('Student profile not found.', 404));

    const timetable = await prisma.timetable.findFirst({
      where: { classId: student.classId, sectionId: student.sectionId || undefined, isActive: true },
      include: {
        entries: {
          include: {
            subject: { select: { name: true } },
            teacher: { include: { user: { select: { name: true } } } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    const entries = (timetable?.entries ?? []).map(e => ({
      dayOfWeek: e.day,
      period: (e as any).periodNumber?.toString() ?? '1',
      startTime: e.startTime,
      endTime: e.endTime,
      subjectName: e.subject.name,
      teacherName: e.teacher?.user?.name ?? null,
    }));

    res.status(200).json({ success: true, data: entries });
  } catch (error) { next(error); }
};

// ── Student Homework Scoping Helper ───────────────────────────────────────
const getStudentHomeworkOrThrow = async (authUser: any, homeworkId: string) => {
  if (authUser.role !== 'student') {
    throw createError('Access denied. Role "student" required.', 403);
  }

  const student = await prisma.student.findUnique({
    where: { userId: authUser.id },
  });

  if (!student) {
    throw createError('Student profile not found.', 404);
  }

  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
  });

  if (!homework) {
    throw createError('Homework not found.', 404);
  }

  if (homework.schoolId && authUser.schoolId && homework.schoolId !== authUser.schoolId) {
    throw createError('Access denied. School mismatch.', 403);
  }

  if (homework.classId !== student.classId) {
    throw createError('Access denied. This homework is not assigned to your class.', 403);
  }

  if (homework.sectionId && homework.sectionId !== student.sectionId) {
    throw createError('Access denied. This homework is not assigned to your section.', 403);
  }

  return { student, homework, schoolId: homework.schoolId };
};

// ── Teacher Homework Authorization Helper ────────────────────────────────
/**
 * Verifies that the authenticated user is a teacher and is authorized
 * to access the given homework (via assignedById, class teacher, subject teacher,
 * or direct class assignment). Returns teacher + homework on success.
 */
const getTeacherHomeworkOrThrow = async (authUser: any, homeworkId: string) => {
  if (authUser.role !== 'teacher') {
    throw createError('Access denied. Role "teacher" required.', 403);
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: authUser.id },
    include: {
      classTeacherOf: true,
      subjectTeachers: true,
      assignedClasses: true,
    },
  });

  if (!teacher) {
    throw createError('Teacher profile not found.', 404);
  }

  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
  });

  if (!homework) {
    throw createError('Homework not found.', 404);
  }

  // School scope check
  if (homework.schoolId && teacher.schoolId && homework.schoolId !== teacher.schoolId) {
    throw createError('Access denied.', 403);
  }

  // Authorization check — at least ONE of these must be true:
  let authorized = false;

  // 1. Teacher created / was assigned the homework
  if (homework.assignedById === teacher.id) {
    authorized = true;
  }

  // 2. Teacher is class teacher of the homework's section
  if (!authorized && homework.sectionId) {
    authorized = teacher.classTeacherOf.some(sec => sec.id === homework.sectionId);
  }

  // 3. Teacher is directly assigned to the homework's class
  if (!authorized) {
    authorized = teacher.assignedClasses.some(cls => cls.id === homework.classId);
  }

  // 4. Teacher teaches the homework's subject in the homework's section
  if (!authorized) {
    authorized = teacher.subjectTeachers.some(
      st =>
        st.subjectId === homework.subjectId &&
        (!homework.sectionId || st.sectionId === homework.sectionId)
    );
  }

  if (!authorized) {
    throw createError('Access denied. You are not authorized for this homework.', 403);
  }

  return { teacher, homework };
};

// ── Teacher Submission Authorization Helper ───────────────────────────────
/**
 * Fetches a HomeworkSubmission and verifies the teacher is authorized
 * for that submission's homework. Returns submission + teacher + homework.
 */
const getTeacherHomeworkSubmissionOrThrow = async (authUser: any, submissionId: string) => {
  if (authUser.role !== 'teacher') {
    throw createError('Access denied. Role "teacher" required.', 403);
  }

  const submission = await prisma.homeworkSubmission.findUnique({
    where: { id: submissionId },
    include: {
      homework: {
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
        },
      },
      student: {
        select: {
          id: true,
          fullName: true,
          admissionNumber: true,
          rollNumber: true,
          userId: true,
        },
      },
    },
  });

  if (!submission) {
    throw createError('Submission not found.', 404);
  }

  // Reuse homework auth check
  const { teacher } = await getTeacherHomeworkOrThrow(authUser, submission.homeworkId);

  return { submission, teacher };
};

// ── Student Homework Submission Endpoints ─────────────────────────────────

export const getStudentHomeworkSubmission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const homeworkId = req.params.homeworkId as string;
    const authUser = req.user!;
    const { student } = await getStudentHomeworkOrThrow(authUser, homeworkId);

    const submission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: { homeworkId, studentId: student.id },
      },
    });

    if (!submission) {
      res.status(200).json({
        success: true,
        data: null,
      });
      return;
    }

    const isReviewed = submission.status === 'reviewed' || submission.reviewedAt !== null;
    const canResubmit = !isReviewed || submission.status === 'returned';

    res.status(200).json({
      success: true,
      data: {
        id: submission.id,
        homeworkId: submission.homeworkId,
        studentId: submission.studentId,
        status: submission.status,
        submissionText: submission.submissionText,
        fileName: submission.fileName,
        mimeType: submission.mimeType,
        fileSize: submission.fileSize,
        submittedAt: submission.submittedAt,
        teacherFeedback: submission.teacherFeedback,
        marks: submission.marks,
        reviewedAt: submission.reviewedAt,
        canResubmit,
      },
    });
  } catch (error) { next(error); }
};

export const submitStudentHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const homeworkId = req.params.homeworkId as string;
    const authUser = req.user!;
    const { student, homework, schoolId } = await getStudentHomeworkOrThrow(authUser, homeworkId);

    const submissionText = req.body.submissionText;
    const file = req.file;

    if (!submissionText && !file) {
      return next(createError('Either submission text or a file is required.', 400));
    }

    // Check existing submission
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: { homeworkId, studentId: student.id },
      },
    });

    if (existingSubmission) {
      const isReviewed = existingSubmission.status === 'reviewed' || existingSubmission.reviewedAt !== null;
      const canResubmit = !isReviewed || existingSubmission.status === 'returned';
      if (!canResubmit) {
        if (file) {
          try { fs.unlinkSync(file.path); } catch (e) {}
        }
        return next(createError('This homework has already been reviewed and cannot be resubmitted.', 400));
      }
    }

    const isLate = homework.dueDate < new Date();
    const status = isLate ? 'late' : 'submitted';

    if (existingSubmission && existingSubmission.filePath && file) {
      try {
        if (fs.existsSync(existingSubmission.filePath)) {
          fs.unlinkSync(existingSubmission.filePath);
        }
      } catch (err) {
        console.error('[MobileController] Error removing old submission file:', err);
      }
    }

    const dataToSave = {
      homeworkId,
      studentId: student.id,
      schoolId: schoolId || authUser.schoolId || null,
      status,
      submissionText: submissionText || null,
      fileName: file ? file.originalname : (existingSubmission ? existingSubmission.fileName : null),
      filePath: file ? file.path : (existingSubmission ? existingSubmission.filePath : null),
      mimeType: file ? file.mimetype : (existingSubmission ? existingSubmission.mimeType : null),
      fileSize: file ? file.size : (existingSubmission ? existingSubmission.fileSize : null),
      submittedAt: new Date(),
    };

    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: { homeworkId, studentId: student.id },
      },
      create: dataToSave,
      update: dataToSave,
    });

    res.status(200).json({
      success: true,
      message: existingSubmission ? 'Homework resubmitted successfully.' : 'Homework submitted successfully.',
      data: submission,
    });
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

// ── Student Homework Endpoint ─────────────────────────────────────────────

export const getStudentHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'student') return next(createError('Access denied.', 403));
    const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
    if (!student) return next(createError('Student profile not found.', 404));

    const homework = await prisma.homework.findMany({
      where: {
        classId: student.classId,
        OR: [{ sectionId: student.sectionId }, { sectionId: null }],
      },
      include: {
        subject: { select: { name: true } },
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 30,
    });

    res.status(200).json({
      success: true,
      data: homework.map(h => {
        const sub = h.submissions[0];
        const hasSubmission = !!sub;
        const isPastDue = h.dueDate < new Date();
        const submissionStatus = hasSubmission ? sub.status : (isPastDue ? 'overdue' : 'pending');
        const isReviewed = hasSubmission && (sub.status === 'reviewed' || sub.reviewedAt !== null);
        const canResubmit = hasSubmission ? (!isReviewed || sub.status === 'returned') : true;

        return {
          id: h.id,
          title: h.title,
          description: h.description,
          subjectName: h.subject.name,
          assignedDate: h.assignedDate,
          dueDate: h.dueDate,
          status: hasSubmission ? sub.status : (isPastDue ? 'submitted' : 'pending'),
          submissionStatus,
          submittedAt: sub ? sub.submittedAt : null,
          hasSubmission,
          fileName: sub ? sub.fileName : null,
          teacherFeedback: sub ? sub.teacherFeedback : null,
          marks: sub ? sub.marks : null,
          canSubmit: !hasSubmission || canResubmit,
          canResubmit,
        };
      }),
    });
  } catch (error) { next(error); }
};

// ── Student Exams Endpoint ────────────────────────────────────────────────

export const getStudentExams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'student') return next(createError('Access denied.', 403));
    const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
    if (!student) return next(createError('Student profile not found.', 404));

    const exams = await prisma.exam.findMany({
      where: { classId: student.classId, startDate: { gte: new Date() }, status: 'scheduled' },
      orderBy: { startDate: 'asc' },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: exams.map(e => ({
        id: e.id, title: e.name, date: e.startDate,
        startTime: null, totalMarks: (e as any).totalMarks ?? 100, subjectName: e.name,
      })),
    });
  } catch (error) { next(error); }
};

// ── Student Results Endpoint ──────────────────────────────────────────────

export const getStudentResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'student') return next(createError('Access denied.', 403));
    const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
    if (!student) return next(createError('Student profile not found.', 404));

    // Model is `Result` in this schema
    const results = await prisma.result.findMany({
      where: { studentId: student.id },
      include: {
        exam: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.status(200).json({
      success: true,
      data: results.map((r: any) => {
        const total = r.maxMarks ?? 100;
        const obtained = r.marksObtained ?? 0;
        return {
          id: r.id,
          examTitle: r.exam?.name ?? 'Exam',
          subjectName: r.subject?.name ?? 'Subject',
          marksObtained: obtained,
          totalMarks: total,
          grade: r.grade ?? null,
          percentage: total > 0 ? Math.round((obtained / total) * 100) : 0,
          status: 'published',
        };
      }),
    });
  } catch (error) { next(error); }
};

// ── Teacher Notices Endpoint ──────────────────────────────────────────────

export const getTeacherNotices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'teacher') return next(createError('Access denied.', 403));
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        schoolId: authUser.schoolId,
        OR: [{ targetRoles: { contains: 'all' } }, { targetRoles: { contains: 'teacher' } }],
      },
      orderBy: { publishDate: 'desc' },
      take: 30,
    });
    res.status(200).json({
      success: true,
      data: notices.map(n => ({
        id: n.id, title: n.title, content: n.content,
        priority: n.priority, publishDate: n.publishDate, targetAudience: n.targetRoles,
      })),
    });
  } catch (error) { next(error); }
};

// ── Teacher Attendance Classes Endpoint ───────────────────────────────────

export const getTeacherAttendanceClasses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'teacher') return next(createError('Access denied.', 403));

    const teacher = await prisma.teacher.findUnique({
      where: { userId: authUser.id },
      include: {
        subjectTeachers: { include: { section: { include: { class: true } } } },
        classTeacherOf: { include: { class: true } },
      },
    });
    if (!teacher) return next(createError('Teacher profile not found.', 404));

    const sectionsMap = new Map<string, { classId: string; className: string; sectionName: string; studentCount: number }>();

    for (const st of teacher.subjectTeachers) {
      if (st.section && !sectionsMap.has(st.section.id)) {
        const count = await prisma.student.count({ where: { sectionId: st.section.id, status: 'active' } });
        sectionsMap.set(st.section.id, {
          classId: st.section.id,
          className: (st.section as any).class?.name ?? 'Class',
          sectionName: st.section.name,
          studentCount: count,
        });
      }
    }
    for (const sec of teacher.classTeacherOf) {
      if (!sectionsMap.has(sec.id)) {
        const count = await prisma.student.count({ where: { sectionId: sec.id, status: 'active' } });
        sectionsMap.set(sec.id, {
          classId: sec.id,
          className: (sec as any).class?.name ?? 'Class',
          sectionName: sec.name,
          studentCount: count,
        });
      }
    }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const markedToday = await prisma.attendance.findMany({
      where: { date: { gte: todayStart, lte: todayEnd }, schoolId: teacher.schoolId },
      select: { student: { select: { sectionId: true } } },
    });
    const markedSectionIds = new Set(markedToday.map(a => a.student?.sectionId).filter(Boolean));

    const classes = Array.from(sectionsMap.entries()).map(([sectionId, info]) => ({
      classId: sectionId,
      className: info.className,
      sectionName: info.sectionName,
      studentCount: info.studentCount,
      attendanceMarked: markedSectionIds.has(sectionId),
    }));

    res.status(200).json({ success: true, data: classes });
  } catch (error) { next(error); }
};

// ── Teacher Attendance Students Endpoint ──────────────────────────────────

export const getTeacherAttendanceStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'teacher') return next(createError('Access denied.', 403));

    const { classId: sectionId, date } = req.query as { classId: string; date?: string };
    if (!sectionId) return next(createError('classId (sectionId) is required.', 400));

    const students = await prisma.student.findMany({
      where: { sectionId, status: 'active' },
      select: { id: true, fullName: true, admissionNumber: true },
      orderBy: { rollNumber: 'asc' },
    });

    const existingMap = new Map<string, string>();
    if (date) {
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
      const existing = await prisma.attendance.findMany({
        where: { studentId: { in: students.map(s => s.id) }, date: { gte: dayStart, lte: dayEnd } },
        select: { studentId: true, status: true },
      });
      existing.forEach(a => existingMap.set(a.studentId, a.status));
    }

    res.status(200).json({
      success: true,
      data: students.map(s => ({
        studentId: s.id,
        studentName: s.fullName,
        admissionNumber: s.admissionNumber,
        status: existingMap.get(s.id) ?? 'present',
      })),
    });
  } catch (error) { next(error); }
};

// ── Teacher Submit Attendance Endpoint ────────────────────────────────────

export const submitTeacherAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'teacher') return next(createError('Access denied.', 403));

    const { classId: sectionId, date, records } = req.body as {
      classId: string;
      date: string;
      records: { studentId: string; status: string }[];
    };

    if (!sectionId || !date || !Array.isArray(records)) {
      return next(createError('classId, date, and records are required.', 400));
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0);

    const ops = records.map(r =>
      prisma.attendance.upsert({
        where: { date_studentId: { date: attendanceDate, studentId: r.studentId } },
        create: {
          studentId: r.studentId,
          date: attendanceDate,
          status: r.status,
          schoolId: authUser.schoolId ?? null,
        },
        update: { status: r.status },
      })
    );

    await prisma.$transaction(ops);

    res.status(200).json({
      success: true,
      message: `Attendance submitted for ${records.length} students.`,
    });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3.1F — TEACHER HOMEWORK REVIEW BACKEND
// ═══════════════════════════════════════════════════════════════════════════

// ── GET /teacher/homework ─────────────────────────────────────────────────
// Returns all homework items the teacher is authorized to review.

export const getTeacherHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    if (authUser.role !== 'teacher') return next(createError('Access denied. Role "teacher" required.', 403));

    const teacher = await prisma.teacher.findUnique({
      where: { userId: authUser.id },
      include: {
        classTeacherOf: true,
        subjectTeachers: true,
        assignedClasses: true,
      },
    });
    if (!teacher) return next(createError('Teacher profile not found.', 404));

    // Build union of authorized homework:
    // (a) homework created by this teacher
    // (b) homework for sections where teacher is class teacher
    // (c) homework for classes directly assigned to teacher
    // (d) homework for subject+section combos taught by teacher
    const classTeacherSectionIds = teacher.classTeacherOf.map(s => s.id);
    const assignedClassIds = teacher.assignedClasses.map(c => c.id);
    const subjectTeacherPairs = teacher.subjectTeachers.map(st => ({
      subjectId: st.subjectId,
      sectionId: st.sectionId,
    }));

    const allHomework = await prisma.homework.findMany({
      where: {
        schoolId: teacher.schoolId,
        OR: [
          { assignedById: teacher.id },
          { sectionId: { in: classTeacherSectionIds } },
          { classId: { in: assignedClassIds } },
          ...subjectTeacherPairs.map(p => ({
            subjectId: p.subjectId,
            sectionId: p.sectionId,
          })),
        ],
      },
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        submissions: {
          select: { id: true, status: true },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    // Deduplicate (union query may overlap)
    const seenIds = new Set<string>();
    const uniqueHomework = allHomework.filter(hw => {
      if (seenIds.has(hw.id)) return false;
      seenIds.add(hw.id);
      return true;
    });

    const result = await Promise.all(
      uniqueHomework.map(async hw => {
        const sectionId = hw.sectionId;
        const totalStudents = sectionId
          ? await prisma.student.count({ where: { sectionId, status: 'active' } })
          : await prisma.student.count({ where: { classId: hw.classId, status: 'active' } });

        const submittedCount = hw.submissions.filter(s =>
          ['submitted', 'late', 'reviewed', 'returned'].includes(s.status)
        ).length;
        const reviewedCount = hw.submissions.filter(s => s.status === 'reviewed').length;
        const returnedCount = hw.submissions.filter(s => s.status === 'returned').length;
        const lateCount = hw.submissions.filter(s => s.status === 'late').length;
        const pendingCount = totalStudents - submittedCount;

        return {
          homeworkId: hw.id,
          title: hw.title,
          description: hw.description,
          className: hw.class.name,
          sectionName: hw.section?.name ?? null,
          subjectName: hw.subject.name,
          dueDate: hw.dueDate,
          assignedDate: hw.assignedDate,
          createdAt: hw.createdAt,
          totalStudents,
          submittedCount,
          pendingCount: Math.max(0, pendingCount),
          reviewedCount,
          returnedCount,
          lateCount,
        };
      })
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ── GET /teacher/homework/:homeworkId/submissions ─────────────────────────
// Returns all student submissions for the given homework.

export const getTeacherHomeworkSubmissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    const homeworkId = req.params.homeworkId as string;

    const { homework } = await getTeacherHomeworkOrThrow(authUser, homeworkId);

    // Fetch all students in the homework's class/section
    const sectionFilter = homework.sectionId
      ? { sectionId: homework.sectionId }
      : { classId: homework.classId };

    const students = await prisma.student.findMany({
      where: { ...sectionFilter, status: 'active' },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        rollNumber: true,
      },
      orderBy: { rollNumber: 'asc' },
    });

    // Fetch all submissions for this homework
    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId },
    });

    const submissionMap = new Map<string, typeof submissions[0]>();
    submissions.forEach(s => submissionMap.set(s.studentId, s));

    const studentList = students.map(student => {
      const sub = submissionMap.get(student.id);
      return {
        studentId: student.id,
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        submissionId: sub?.id ?? null,
        status: sub?.status ?? 'pending',
        submittedAt: sub?.submittedAt ?? null,
        hasFile: !!(sub?.fileName),
        hasText: !!(sub?.submissionText),
        fileName: sub?.fileName ?? null,
        marks: sub?.marks ?? null,
        teacherFeedback: sub?.teacherFeedback ?? null,
        reviewedAt: sub?.reviewedAt ?? null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        homework: {
          homeworkId: homework.id,
          title: homework.title,
          description: homework.description,
          className: homework.class.name,
          sectionName: homework.section?.name ?? null,
          subjectName: homework.subject.name,
          dueDate: homework.dueDate,
        },
        students: studentList,
      },
    });
  } catch (error) { next(error); }
};

// ── GET /teacher/homework/submissions/:submissionId ───────────────────────
// Returns full detail for a single submission.

export const getTeacherSubmissionDetail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    const submissionId = req.params.submissionId as string;

    const { submission } = await getTeacherHomeworkSubmissionOrThrow(authUser, submissionId);

    const hw = submission.homework;

    res.status(200).json({
      success: true,
      data: {
        submissionId: submission.id,
        homeworkId: hw.id,
        homeworkTitle: hw.title,
        className: hw.class.name,
        sectionName: hw.section?.name ?? null,
        subjectName: hw.subject.name,
        dueDate: hw.dueDate,
        student: {
          studentId: submission.student.id,
          studentName: submission.student.fullName,
          admissionNumber: submission.student.admissionNumber,
          rollNumber: submission.student.rollNumber,
        },
        submissionText: submission.submissionText ?? null,
        fileName: submission.fileName ?? null,
        // filePath intentionally NOT included — use the download endpoint
        mimeType: submission.mimeType ?? null,
        fileSize: submission.fileSize ?? null,
        status: submission.status,
        submittedAt: submission.submittedAt,
        teacherFeedback: submission.teacherFeedback ?? null,
        marks: submission.marks ?? null,
        reviewedAt: submission.reviewedAt ?? null,
        canReview: ['submitted', 'late'].includes(submission.status),
        canReturn: submission.status === 'reviewed',
        canDownload: !!(submission.fileName && submission.filePath),
      },
    });
  } catch (error) { next(error); }
};

// ── PATCH /teacher/homework/submissions/:submissionId/review ──────────────
// Teacher adds feedback, marks, and sets status (reviewed | returned).

export const reviewTeacherSubmission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    const submissionId = req.params.submissionId as string;
    const { status, teacherFeedback, marks } = req.body as {
      status?: string;
      teacherFeedback?: string;
      marks?: number;
    };

    const { submission, teacher } = await getTeacherHomeworkSubmissionOrThrow(authUser, submissionId);

    // Validate status
    const allowedStatuses = ['reviewed', 'returned'];
    if (status && !allowedStatuses.includes(status)) {
      return next(createError(`Invalid status. Allowed: ${allowedStatuses.join(', ')}.`, 400));
    }

    // Validate marks
    if (marks !== undefined && marks !== null) {
      if (typeof marks !== 'number' || marks < 0 || isNaN(marks)) {
        return next(createError('Marks must be a non-negative number.', 400));
      }
    }

    const updatedSubmission = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        status: status ?? submission.status,
        teacherFeedback: teacherFeedback !== undefined ? teacherFeedback : submission.teacherFeedback,
        marks: marks !== undefined ? marks : submission.marks,
        reviewedAt: status ? new Date() : submission.reviewedAt,
        reviewedById: status ? authUser.id : submission.reviewedById,
      },
    });

    // Push notification to student (best-effort, non-blocking)
    if (status && submission.student.userId) {
      const notifTitle =
        status === 'reviewed'
          ? 'Homework Reviewed'
          : 'Homework Returned for Resubmission';
      const notifBody =
        status === 'reviewed'
          ? `Your homework "${submission.homework.title}" has been reviewed.`
          : `Your homework "${submission.homework.title}" was returned. Please resubmit.`;
      PushNotificationService.sendToUser(submission.student.userId, {
        title: notifTitle,
        body: notifBody,
        data: {
          type: status === 'reviewed' ? 'homework_reviewed' : 'homework_returned',
          homeworkId: submission.homeworkId,
          submissionId: submission.id,
        },
      }).catch(() => {
        // Swallow push errors — non-critical
      });
    }

    res.status(200).json({
      success: true,
      message:
        status === 'reviewed'
          ? 'Submission marked as reviewed.'
          : status === 'returned'
          ? 'Submission returned to student for resubmission.'
          : 'Submission updated.',
      data: {
        submissionId: updatedSubmission.id,
        status: updatedSubmission.status,
        teacherFeedback: updatedSubmission.teacherFeedback,
        marks: updatedSubmission.marks,
        reviewedAt: updatedSubmission.reviewedAt,
      },
    });
  } catch (error) { next(error); }
};

// ── GET /teacher/homework/submissions/:submissionId/download ──────────────
// Securely streams the private submission file to the authorized teacher.

export const downloadTeacherSubmissionFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    const submissionId = req.params.submissionId as string;

    const { submission } = await getTeacherHomeworkSubmissionOrThrow(authUser, submissionId);

    if (!submission.filePath || !submission.fileName) {
      return next(createError('No file attached to this submission.', 404));
    }

    // Resolve absolute path and prevent path traversal
    const privateBase = path.resolve(process.cwd(), 'private_uploads', 'homework-submissions');
    const requestedPath = path.resolve(submission.filePath);

    if (!requestedPath.startsWith(privateBase)) {
      return next(createError('Access denied. Invalid file path.', 403));
    }

    if (!fs.existsSync(requestedPath)) {
      return next(createError('File not found on server.', 404));
    }

    // Stream file to teacher with the original filename
    res.download(requestedPath, submission.fileName, err => {
      if (err && !res.headersSent) {
        next(createError('File download failed.', 500));
      }
    });
  } catch (error) { next(error); }
};
