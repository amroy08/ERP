import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';
import { FeeService } from '../services/FeeService';
import { getSchoolScope } from '../utils/schoolScope';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const scope = getSchoolScope(req);

    if (user.role === 'admin' || user.role === 'super_admin') {
      const [
        totalStudents,
        totalTeachers,
        totalStaff,
        pendingAdmissions,
        totalEnquiries,
        todayAttendance,
        feeCollection,
        recentNotices,
        upcomingExams,
        classesWithCounts,
        admissionsResult,
        totalSchools,
      ] = await Promise.all([
        prisma.student.count({ where: { status: 'active', ...scope } }),
        prisma.teacher.count({ where: { status: 'active', ...scope } }),
        prisma.staff.count({ where: { status: 'active', ...scope } }),
        prisma.admission.count({ where: { status: { in: ['new', 'under_review'] }, ...scope } }),
        prisma.enquiry.count({ where: { status: { in: ['new', 'contacted', 'follow_up'] }, ...scope } }),
        prisma.attendance.groupBy({
          by: ['status'],
          where: { date: { gte: today, lt: tomorrow }, ...scope },
          _count: { _all: true }
        }),
        prisma.feePayment.aggregate({
          where: { paymentDate: { gte: startOfMonth }, ...scope },
          _sum: { amountPaid: true }
        }),
        prisma.notice.findMany({
          where: { isPublished: true, ...scope },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        prisma.exam.findMany({
          where: { startDate: { gte: today }, status: 'scheduled', ...scope },
          include: { class: { select: { name: true } } },
          orderBy: { startDate: 'asc' },
          take: 5
        }),
        prisma.class.findMany({
          where: scope,
          select: {
            name: true,
            numericValue: true,
            _count: { select: { students: { where: { status: 'active' } } } }
          },
          orderBy: { numericValue: 'asc' },
          take: 12
        }),
        prisma.admission.findMany({
          where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) }, ...scope },
          select: { createdAt: true }
        }),
        prisma.school.count()
      ]);

      const attendanceMap: Record<string, number> = {};
      todayAttendance.forEach(a => { attendanceMap[a.status] = a._count._all; });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const admissionCounts = new Array(12).fill(0);
      admissionsResult.forEach(a => { admissionCounts[a.createdAt.getMonth()]++; });

      const admissionChartData = months.map((month, idx) => ({ month, count: admissionCounts[idx] }))
        .filter((_, idx) => idx <= new Date().getMonth());

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalStudents,
            totalTeachers,
            totalStaff,
            totalSchools,
            pendingAdmissions,
            totalEnquiries,
            monthlyFeeCollection: feeCollection._sum.amountPaid || 0,
          },
          todayAttendance: {
            present: attendanceMap['present'] || 0,
            absent: attendanceMap['absent'] || 0,
            late: attendanceMap['late'] || 0,
            halfDay: attendanceMap['half_day'] || 0,
            leave: attendanceMap['leave'] || 0,
            total: Object.values(attendanceMap).reduce((a, b) => a + b, 0),
          },
          recentNotices,
          upcomingExams,
          studentsByClass: classesWithCounts.map(c => ({ class: c.name, count: c._count.students })),
          admissionChartData,
          attendanceTrend: [],
        },
      });
      return;
    }

    if (user.role === 'teacher') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: user.id as string, ...scope },
        include: { 
          subjects: { select: { classId: true } },
          assignedClasses: { select: { id: true } },
          classTeacherOf: { select: { id: true, classId: true } }
        }
      });

      if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher record not found' });
        return;
      }

      const classIds = new Set<string>(teacher.subjects.map(s => s.classId));
      teacher.assignedClasses.forEach(c => classIds.add(c.id));
      teacher.classTeacherOf.forEach(s => classIds.add(s.classId));
      
      const sectionIds = teacher.classTeacherOf.map(s => s.id);
      const classIdArray = Array.from(classIds);

      const [totalActiveStudents, totalClasses, totalSubjects, pendingHomework, recentNotices] = await Promise.all([
        prisma.student.count({ 
          where: { OR: [{ classId: { in: classIdArray } }, { sectionId: { in: sectionIds } }], status: 'active', ...scope } 
        }),
        prisma.class.count({ where: { id: { in: classIdArray }, ...scope } }),
        prisma.subject.count({ where: { teacherId: teacher.id, ...scope } }),
        prisma.homework.count({ where: { assignedById: teacher.id, dueDate: { gte: today }, ...scope } }),
        prisma.notice.findMany({ where: { isPublished: true, ...scope }, orderBy: { createdAt: 'desc' }, take: 5 })
      ]);

      res.status(200).json({
        success: true,
        data: {
          teacherStats: { totalActiveStudents, totalClasses, totalSubjects, pendingHomework },
          recentNotices,
          message: 'Personalized teacher dashboard data'
        }
      });
      return;
    }

    if (user.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id as string },
        include: {
          children: {
            select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } }
          }
        }
      });
      
      const notices = await prisma.notice.findMany({ where: { isPublished: true, ...scope }, orderBy: { createdAt: 'desc' }, take: 5 });
      
      res.status(200).json({
        success: true,
        data: { parent, recentNotices: notices, message: 'Personalized parent dashboard data' }
      });
      return;
    }

    if (user.role === 'student') {
      const student = await prisma.student.findFirst({
        where: { userId: user.id as string, ...scope },
        include: { 
          class: { select: { name: true } }, 
          section: { select: { name: true } }
        }
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student record not found' });
        return;
      }

      const [ledger, notices] = await Promise.all([
        FeeService.getStudentLedger(student.id),
        prisma.notice.findMany({ where: { isPublished: true, ...scope }, orderBy: { createdAt: 'desc' }, take: 5 })
      ]);

      res.status(200).json({
        success: true,
        data: { 
          student: { ...student, balanceDue: ledger.balanceDue }, 
          recentNotices: notices, 
          message: 'Personalized student dashboard data' 
        }
      });
      return;
    }

    const commonNotices = await prisma.notice.findMany({ where: { isPublished: true, ...scope }, orderBy: { createdAt: 'desc' }, take: 5 });
    res.status(200).json({ success: true, data: { recentNotices: commonNotices, message: 'Personalized dashboard data' } });
  } catch (error: any) { 
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
