import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';
import { AdmissionService } from '../services/AdmissionService';
import { TeacherService } from '../services/TeacherService';
import { ArchiveService } from '../services/ArchiveService';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { getSchoolScope } from '../utils/schoolScope';

// ── License Check Helper ──────────────────────────────
const checkRoleLicense = async (roleName: string): Promise<string | null> => {
  const school = await prisma.school.findFirst();
  const licensedRoles = (school?.licensedRoles as string[]) || [];
  // If licensedRoles is empty (not configured yet), allow everything
  if (licensedRoles.length === 0) return null;
  if (!licensedRoles.includes(roleName)) {
    return `Your institution's subscription does not include the ${roleName} portal. Please upgrade your plan to create ${roleName} accounts.`;
  }
  return null;
};


// ── Teachers ──────────────────────────────────────────
export const getTeachers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status } = req.query as Record<string, string>;
    const scope = getSchoolScope(req);
    const teachers = await prisma.teacher.findMany({
      where: {
        AND: [
          status ? { status } : {},
          scope,
          search ? {
            OR: [
              { user: { name: { contains: search } } },
              { user: { email: { contains: search } } },
              { employeeId: { contains: search } }
            ]
          } : {}
        ]
      },
      include: {
        user: { select: { name: true, email: true, profilePhoto: true, phone: true } },
        subjects: { select: { name: true, code: true } },
        assignedClasses: { select: { id: true, name: true } },
        classTeacherOf: { select: { id: true, name: true, class: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: teachers });
  } catch (error) { next(error); }
};

export const getTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacher = await prisma.teacher.findFirst({
      where: { id: req.params.id as string, ...getSchoolScope(req) as any },
      include: {
        user: { select: { name: true, email: true, profilePhoto: true, phone: true } },
        subjects: { select: { id: true, name: true, code: true } },
        assignedClasses: { select: { id: true, name: true } },
        classTeacherOf: { select: { id: true, name: true, class: { select: { id: true, name: true } } } }
      }
    });

    if (!teacher) {
      next(createError('Teacher not found', 404));
      return;
    }

    // RBAC: Teachers can only view their own profile
    const authUser = (req as any).user;
    if (authUser.role === 'teacher' && teacher.userId !== authUser.id) {
      return next(createError('Access denied. You can only view your own profile.', 403));
    }

    res.json({ success: true, data: teacher });
  } catch (error) { next(error); }
};

export const createTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // License gate
    const licenseError = await checkRoleLicense('teacher');
    if (licenseError) {
      res.status(403).json({ success: false, message: licenseError });
      return;
    }
    const result = await TeacherService.createTeacher(req.body, req.user?.schoolId || undefined);
    res.status(201).json({ 
      success: true, 
      message: 'Teacher created successfully',
      ...result 
    });
  } catch (error) { next(error); }
};

export const updateTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      firstName, lastName, email, phone, employeeId, 
      qualification, designation, joiningDate, status, 
      canViewAllStudents, assignedClassIds, sectionsAsClassTeacher 
    } = req.body;
    
    const teacherId = req.params.id;

    // Check if teacher exists to get userId
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId as string },
      select: { userId: true }
    });

    if (!existingTeacher) {
      next(createError('Teacher not found', 404));
      return;
    }

    const updatedTeacher = await prisma.$transaction(async (tx) => {
      // 1. Update Teacher Record
      const t = await tx.teacher.update({
        where: { id: teacherId as string },
        data: {
          employeeId,
          qualification,
          designation,
          joiningDate: joiningDate ? new Date(joiningDate) : undefined,
          status,
          canViewAllStudents: canViewAllStudents !== undefined ? !!canViewAllStudents : undefined,
          assignedClasses: assignedClassIds ? {
            set: assignedClassIds.map((id: string) => ({ id }))
          } : undefined,
          classTeacherOf: sectionsAsClassTeacher ? {
            set: sectionsAsClassTeacher.map((id: string) => ({ id }))
          } : undefined
        },
        include: { user: true }
      });

      // 2. Update Associated User Records if provided
      if (firstName || lastName || email || phone) {
        await tx.user.update({
          where: { id: existingTeacher.userId },
          data: {
            name: firstName && lastName ? `${firstName} ${lastName}` : undefined,
            email,
            phone
          }
        });
      }

      return t;
    });

    res.json({ success: true, message: 'Teacher updated successfully', data: updatedTeacher });
  } catch (error) { 
    console.error('Update teacher error:', error);
    next(error); 
  }
};

export const deleteTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ArchiveService.moveToArchive('teacher', req.params.id as string, req.user?.id);
    res.json({ success: true, message: `Teacher ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

export const resetTeacherPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id as string },
      select: { userId: true }
    });

    if (!teacher || !teacher.userId) {
      next(createError('Teacher user account not found', 404));
      return;
    }

    const defaultPassword = 'Teacher@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await prisma.user.update({
      where: { id: teacher.userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password reset to Teacher@123' });
  } catch (error) { next(error); }
};

export const resetStaffPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id as string },
      select: { userId: true }
    });

    if (!staff || !staff.userId) {
      next(createError('Staff user account not found', 404));
      return;
    }

    const defaultPassword = 'Staff@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await prisma.user.update({
      where: { id: staff.userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password reset to Staff@123' });
  } catch (error) { next(error); }
};

// ── Staff ─────────────────────────────────────────────
export const getStaff = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status } = req.query as Record<string, string>;
    const scope = getSchoolScope(req);
    const staff = await prisma.staff.findMany({
      where: {
        AND: [
          status ? { status } : {},
          scope,
          search ? {
            OR: [
              { user: { name: { contains: search } } },
              { department: { contains: search } }
            ]
          } : {}
        ]
      },
      include: {
        user: { select: { name: true, email: true, profilePhoto: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};

export const getStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      include: {
        user: { select: { name: true, email: true, profilePhoto: true, phone: true, isActive: true } }
      }
    });
    if (!staff) return next(createError('Staff member not found', 404));
    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};

export const createStaff = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // License gate
    const licenseError = await checkRoleLicense('staff');
    if (licenseError) {
      res.status(403).json({ success: false, message: licenseError });
      return;
    }
    const { firstName, lastName, email, phone, department, role, joiningDate, status, employeeId: customEmployeeId } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const prefix = firstName.toLowerCase().replace(/\s/g, '');
      const loginEmail = `stf.${prefix}@school.local`;
      const targetEmail = email || loginEmail;

      // Check if user already exists
      const existingUser = await tx.user.findUnique({ where: { email: targetEmail } });
      if (existingUser) {
        throw createError('This email address is already registered in the system.', 400);
      }

      const rawPassword = `STF@${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: targetEmail,
          password: hashedPassword,
          role: 'clerk',
          phone: phone,
          isActive: status === 'active',
          schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
        }
      });

      // 2. Create Staff Record
      let employeeId = customEmployeeId;
      if (employeeId) {
        const existingStaff = await tx.staff.findUnique({ where: { employeeId } });
        if (existingStaff) throw createError('Employee ID already exists', 400);
      } else {
        const count = await tx.staff.count();
        employeeId = `EMP-STF-${String(count + 1).padStart(3, '0')}`;
      }
      
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          employeeId,
          department,
          designation: role,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          status: status || 'active',
          schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
        }
      });

      return { staff, credentials: { email: user.email, password: rawPassword } };
    });

    res.status(201).json({ 
      success: true, 
      message: 'Staff member registered successfully',
      data: result.staff,
      credentials: result.credentials
    });
  } catch (error) { 
    console.error('Create staff error:', error);
    next(error); 
  }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staff = await prisma.staff.update({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data: req.body
    });
    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};

export const deleteStaff = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ArchiveService.moveToArchive('staff', req.params.id as string, req.user?.id);
    res.json({ success: true, message: `Staff member ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

// ── Parents ───────────────────────────────────────────
export const getParents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query as Record<string, string>;
    const parents = await prisma.parent.findMany({
      where: {
        AND: [
          getSchoolScope(req),
          search ? {
            OR: [
              { fatherName: { contains: search } },
              { user: { email: { contains: search } } }
            ]
          } : {}
        ]
      },
      include: {
        children: { select: { id: true, fullName: true, admissionNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: parents });
  } catch (error) { next(error); }
};

export const deleteParent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ArchiveService.moveToArchive('parent', req.params.id as string, req.user?.id);
    res.json({ success: true, message: `Guardian record for ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

// ── System Archive ────────────────────────────────────
export const getArchives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.query;
    const archives = await (prisma as any).archive.findMany({
      where: type ? { entityType: type as string } : {},
      orderBy: { deletedAt: 'desc' }
    });
    res.json({ success: true, data: archives });
  } catch (error) { next(error); }
};

export const restoreArchive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ArchiveService.restoreFromArchive(req.params.id as string);
    res.json({ success: true, message: 'Record restored successfully' });
  } catch (error) { next(error); }
};

export const purgeArchive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await (prisma as any).archive.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Record permanently deleted' });
  } catch (error) { next(error); }
};

export const getStudentAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId } = req.params;
    const authUser = (req as any).user;

    // RBAC: Students can only view their own report
    if (authUser.role === 'student') {
        const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
        if (!student || student.id !== studentId) {
            res.status(403).json({ success: false, message: 'Access denied. You can only view your own attendance report.' });
            return;
        }
    }

    const records = await prisma.attendance.findMany({
      where: { studentId: studentId as string },
      orderBy: { date: 'desc' },
      take: 100
    });
    
    // Summary stats
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    res.json({ 
      success: true, 
      data: {
        records,
        stats: { total, present, absent, late, percentage }
      }
    });
  } catch (error) { next(error); }
};

// ── Notices ───────────────────────────────────────────
export const getNotices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    const filter: any = {};

    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      filter.OR = [
        { targetRoles: { contains: 'all' } },
        { targetRoles: { contains: authUser.role } }
      ];
    }

    const notices = await prisma.notice.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: notices });
  } catch (error) { next(error); }
};

export const createNotice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, targetRoles, priority, type, audience } = req.body;
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      fileUrl = `/uploads/notices/${req.file.filename}`;
    }

    const notice = await prisma.notice.create({
      data: { 
        title, 
        content: content || '', 
        targetRoles: Array.isArray(audience) ? audience.join(',') : (audience || targetRoles || 'all'),
        priority: priority || 'normal',
        type: type || (req.file ? 'file' : 'text'),
        fileUrl,
        createdBy: req.user!.id,
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      }
    });
    res.status(201).json({ success: true, data: notice });
  } catch (error) { next(error); }
};

export const updateNotice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { audience, ...updateData } = req.body;
    
    if (audience) {
      updateData.targetRoles = Array.isArray(audience) ? audience.join(',') : audience;
    }

    if (req.file) {
      // Delete old file if exists
      const oldNotice = await prisma.notice.findUnique({ where: { id: req.params.id as string } });
      if (oldNotice?.fileUrl) {
        const oldPath = path.join(process.cwd(), oldNotice.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.fileUrl = `/uploads/notices/${req.file.filename}`;
      updateData.type = 'file';
    }

    const notice = await prisma.notice.update({
      where: { id: req.params.id as string },
      data: updateData
    });
    res.json({ success: true, data: notice });
  } catch (error) { next(error); }
};

export const deleteNotice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ArchiveService.moveToArchive('notice', req.params.id as string, req.user?.id);
    res.json({ success: true, message: `Notice "${result.name}" archived successfully` });
  } catch (error) { next(error); }
};

// ── Enquiries ─────────────────────────────────────────
export const getEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query as Record<string, string>;
    const enquiries = await prisma.enquiry.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: enquiries });
  } catch (error) { next(error); }
};

export const createEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enquiry = await prisma.enquiry.create({ data: { ...req.body, schoolId: (req as any).user?.schoolId } });
    res.status(201).json({ success: true, data: enquiry });
  } catch (error) { next(error); }
};

export const updateEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enquiry = await prisma.enquiry.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json({ success: true, data: enquiry });
  } catch (error) { next(error); }
};

// ── Admissions ────────────────────────────────────────
export const getAdmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search } = req.query as Record<string, string>;
    const admissions = await prisma.admission.findMany({
      where: {
        AND: [
          status ? { status } : {},
          search ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { parentName: { contains: search } },
              { parentPhone: { contains: search } }
            ]
          } : {}
        ]
      },
      include: {
        class: { select: { id: true, name: true } },
        assignedFees: {
          include: { feeStructure: { select: { id: true, name: true, totalAmount: true, components: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: admissions });
  } catch (error) { next(error); }
};

export const getAdmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admission = await prisma.admission.findUnique({
      where: { id: req.params.id as string },
      include: {
        class: { select: { id: true, name: true } },
        assignedFees: {
          include: { feeStructure: { select: { id: true, name: true, totalAmount: true, components: true } } }
        }
      }
    });
    if (!admission) { next(createError('Admission not found', 404)); return; }
    res.json({ success: true, data: admission });
  } catch (error) { next(error); }
};

export const createAdmission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, ...getSchoolScope(req) } });
    if (!academicYear) { next(createError('No active academic year', 400)); return; }
    
    // Generate application number
    const count = await prisma.admission.count();
    const applicationNo = `ADM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const { feeAssignments, dateOfBirth, ...admissionData } = req.body;
    
    const admission = await prisma.admission.create({
      data: {
        ...admissionData,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
        applicationNo,
        academicYearId: academicYear.id,
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId,
        assignedFees: feeAssignments && feeAssignments.length > 0 ? {
          create: feeAssignments.map((fa: { feeStructureId: string; amount: number }) => ({ 
            feeStructureId: fa.feeStructureId,
            customAmount: fa.amount 
          }))
        } : undefined
      }
    });
    res.status(201).json({ success: true, data: admission });
  } catch (error) { next(error); }
};

export const updateAdmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { feeAssignments, dateOfBirth, ...admissionData } = req.body;
    
    const admission = await prisma.admission.update({
      where: { id: req.params.id as string },
      data: {
        ...admissionData,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        assignedFees: feeAssignments ? {
          deleteMany: {}, // Clear existing assignments
          create: feeAssignments.map((fa: { feeStructureId: string; amount: number }) => ({ 
            feeStructureId: fa.feeStructureId,
            customAmount: fa.amount
          }))
        } : undefined
      }
    });
    res.json({ success: true, data: admission });
  } catch (error) { next(error); }
};

export const convertAdmissionToStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AdmissionService.convertToStudent(id as string, req.user!.id as string, req.body);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ── Classes ───────────────────────────────────────────
export const getClasses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    const scope = getSchoolScope(req);
    const where: any = { ...scope };

    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: authUser.id },
        include: { 
          subjects: { select: { classId: true } },
          assignedClasses: { select: { id: true } }
        }
      });
      if (teacher) {
        const allowedClassIds = Array.from(new Set([
          ...teacher.subjects.map(s => s.classId),
          ...teacher.assignedClasses.map(c => c.id)
        ]));
        where.id = { in: allowedClassIds };
      }
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        sections: true,
        subjects: { select: { name: true, code: true } }
      },
      orderBy: { numericValue: 'asc' }
    });
    res.json({ success: true, data: classes });
  } catch (error) { next(error); }
};


export const createClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scope = getSchoolScope(req) as any;
    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, ...scope } });
    if (!academicYear) { next(createError('No active academic year', 400)); return; }
    
    const cls = await prisma.class.create({ 
      data: { ...req.body, schoolId: scope.schoolId || req.user?.schoolId }
    });
    res.status(201).json({ success: true, data: cls });
  } catch (error) { next(error); }
};


export const updateClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const cls = await prisma.class.update({
      where: { id: id as string, ...getSchoolScope(req) },
      data: req.body
    });
    res.json({ success: true, data: cls });
  } catch (error) { next(error); }
};


export const deleteClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ArchiveService.moveToArchive('class', req.params.id as string, req.user?.id);
    res.json({ success: true, message: `Class ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

// ── Subjects ──────────────────────────────────────────
export const getSubjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        class: { select: { id: true, name: true } },
        teacher: { 
          include: { user: { select: { name: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: subjects });
  } catch (error) { next(error); }
};

export const createSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subject = await prisma.subject.create({
      data: { ...req.body, schoolId: (req as any).user?.schoolId }
    });
    res.status(201).json({ success: true, data: subject });
  } catch (error) { next(error); }
};

export const updateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.update({
      where: { id: id as string },
      data: req.body
    });
    res.json({ success: true, data: subject });
  } catch (error) { next(error); }
};

export const deleteSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ArchiveService.moveToArchive('subject', req.params.id as string, req.user?.id);
    res.json({ success: true, message: `Subject ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

// ── Attendance ────────────────────────────────────────
export const getAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, startDate, endDate, classId, sectionId } = req.query as Record<string, string>;
    
    let dateFilter: Record<string, unknown> = {};
    if (date) {
      // Use UTC normalization for strings like 'YYYY-MM-DD'
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const d = new Date(dateStr + 'T00:00:00Z');
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      dateFilter = { gte: d, lt: nextDay };
    } else if (startDate && endDate) {
      const startStr = startDate.includes('T') ? startDate.split('T')[0] : startDate;
      const endStr = endDate.includes('T') ? endDate.split('T')[0] : endDate;
      dateFilter = {
        gte: new Date(startStr + 'T00:00:00Z'),
        lte: new Date(endStr + 'T23:59:59Z')
      };
    }

    const authUser = req.user!;
    const where: any = {
      AND: [
        (date || (startDate && endDate)) ? { date: dateFilter } : {},
        classId ? { student: { classId } } : {},
        sectionId ? { student: { sectionId } } : {}
      ]
    };

    if (authUser.role === 'student') {
      const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
      if (student) {
        where.AND.push({ studentId: student.id });
      } else {
        // If student role but no record found, return empty
        where.AND.push({ studentId: 'non-existent' });
      }
    } else if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: authUser.id as string },
        include: { 
          subjects: { select: { classId: true } },
          assignedClasses: { select: { id: true } },
          classTeacherOf: { select: { id: true } }
        }
      });
      if (teacher) {
        const subjectClassIds = teacher.subjects.map(s => s.classId);
        const assignedClassIdsFromRelation = teacher.assignedClasses.map(c => c.id);
        const classTeacherSectionIds = teacher.classTeacherOf.map(s => s.id);
        
        const allAllowedClassIds = Array.from(new Set([...subjectClassIds, ...assignedClassIdsFromRelation]));
        
        where.AND.push({
          OR: [
            { student: { classId: { in: allAllowedClassIds } } },
            { student: { sectionId: { in: classTeacherSectionIds } } }
          ]
        });
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: { fullName: true, admissionNumber: true, rollNumber: true }
        }
      }
    });
    res.json({ success: true, data: attendance });
  } catch (error) { next(error); }
};

export const markAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { records } = req.body;
    const authUser = req.user!;

    // Protection logic for teachers
    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: authUser.id },
        include: { 
          subjects: { select: { classId: true } },
          assignedClasses: { select: { id: true } },
          classTeacherOf: { select: { id: true } }
        }
      });
      if (!teacher) { next(createError('Teacher record not found', 404)); return; }
      
      if (!teacher.canViewAllStudents) {
        const allowedClassIds = new Set([
          ...teacher.subjects.map(s => s.classId),
          ...teacher.assignedClasses.map(c => c.id)
        ]);
        const allowedSectionIds = new Set(teacher.classTeacherOf.map(s => s.id));
        
        const studentIds = records.map((r: any) => r.studentId);
        const students = await prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, classId: true, sectionId: true }
        });

        const unauthorized = students.some(s => 
          !allowedClassIds.has(s.classId) && !allowedSectionIds.has(s.sectionId)
        );
        
        // Optional: Log unauthorized attempt instead of blocking for now
        // if (unauthorized) {
        //   console.warn(`Teacher ${teacher.id} marked attendance for unassigned class/section.`);
        // }
      }
    }

    const results = await prisma.$transaction(
      records.map((record: any) => {
        // Robust UTC normalization
        const dateStr = record.date.includes('T') ? record.date.split('T')[0] : record.date;
        const dateObj = new Date(dateStr + 'T00:00:00Z');
        
        return prisma.attendance.upsert({
          where: {
            date_studentId: {
              date: dateObj,
              studentId: record.studentId
            }
          },
          update: {
            status: record.status,
            remark: record.remark
          },
          create: {
            date: dateObj,
            status: record.status,
            remark: record.remark,
            studentId: record.studentId
          }
        });
      })
    );
    
    res.status(201).json({ success: true, message: `Attendance marked for ${results.length} students`, data: results });
  } catch (error) { next(error); }
};

// ── School Settings ───────────────────────────────────
export const getSchoolSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    // Load the user's school, or the first one for super_admin
    const scopedId = req.headers['x-school-id'];
    let school = (user?.role === 'super_admin' && scopedId)
      ? await prisma.school.findUnique({ where: { id: scopedId as string } })
      : user?.schoolId 
        ? await prisma.school.findUnique({ where: { id: user.schoolId } })
        : await prisma.school.findFirst();
      
    const allRoles = ['admin', 'staff', 'teacher', 'student', 'parent'];
    const allModules = ['attendance', 'homework', 'exams', 'timetable', 'fees', 'notices', 'library', 'inventory', 'transport', 'admissions'];
    
    if (!school) {
        school = await prisma.school.create({
          data: {
            name: 'School ERP',
            address: 'Address missing',
            phone: '0000000000',
            email: 'admin@school.com',
            enabledModules: allModules,
            licensedRoles: allRoles,
            licensePlan: 'enterprise'
          }
        });
    } else {
      const updates: any = {};
      if (!school.enabledModules) {
        updates.enabledModules = allModules;
      }
      if (!school.licensedRoles) {
        updates.licensedRoles = allRoles;
        updates.licensePlan = 'enterprise';
      }
      if (Object.keys(updates).length > 0) {
        school = await prisma.school.update({
          where: { id: school.id },
          data: updates
        });
      }
    }
    res.json({ success: true, data: school });
  } catch (error) { next(error); }
};

export const updateSchoolSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    // Scope: admin updates their own school; super admin can update the first/specified
    const existing = user?.schoolId 
      ? await prisma.school.findUnique({ where: { id: user.schoolId } })
      : await prisma.school.findFirst();
    let school;
    if (existing) {
      school = await prisma.school.update({
        where: { id: existing.id },
        data: req.body
      });
    } else {
      school = await prisma.school.create({ data: req.body });
    }
    res.json({ success: true, data: school });
  } catch (error) { next(error); }
};

// ── Academic Years ────────────────────────────────────


export const getAcademicYears = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const years = await prisma.academicYear.findMany({
      where: getSchoolScope(req),
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: years });
  } catch (error) { next(error); }
};


export const createAcademicYear = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scope = getSchoolScope(req) as any;
    const { isCurrent, ...rest } = req.body;

    const year = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId: scope.schoolId || req.user?.schoolId },
          data: { isCurrent: false }
        });
      }
      return await tx.academicYear.create({
        data: {
          ...rest,
          isCurrent,
          schoolId: scope.schoolId || req.user?.schoolId
        }
      });
    });

    res.status(201).json({ success: true, data: year });
  } catch (error) { next(error); }
};


export const updateAcademicYear = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scope = getSchoolScope(req) as any;
    const { isCurrent, ...rest } = req.body;

    const year = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId: scope.schoolId || req.user?.schoolId },
          data: { isCurrent: false }
        });
      }
      return await tx.academicYear.update({
        where: { 
          id: req.params.id as string,
          ...scope
        },
        data: {
          ...rest,
          isCurrent
        }
      });
    });

    res.json({ success: true, data: year });
  } catch (error) { next(error); }
};



// ── Sections ──────────────────────────────────────────
export const getSections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query as Record<string, string>;
    const authUser = req.user!;
    const scope = getSchoolScope(req);
    const where: any = { 
      ...scope,
      ...(classId ? { classId: classId } : {})
    };

    if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: authUser.id },
        include: { 
          assignedClasses: { select: { id: true } },
          classTeacherOf: { select: { id: true } },
          subjects: { select: { classId: true } }
        }
      });
      if (teacher) {
        const assignedClassIds = teacher.assignedClasses.map(c => c.id);
        const subjectClassIds = teacher.subjects.map(s => s.classId);
        const sectionTeacherIds = teacher.classTeacherOf.map(s => s.id);
        
        const allAllowedClassIds = Array.from(new Set([...assignedClassIds, ...subjectClassIds]));
        
        where.OR = [
            { classId: { in: allAllowedClassIds } },
            { id: { in: sectionTeacherIds } }
        ];
      }
    }

    const sections = await prisma.section.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: sections });
  } catch (error) { next(error); }
};


export const getSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await prisma.section.findUnique({
      where: { id: id as string },
      include: { 
        class: { select: { id: true, name: true } },
        classTeacher: { 
          include: { 
            user: { select: { name: true } } 
          } 
        }
      }
    });
    if (!section) {
      next(createError('Section not found', 404));
      return;
    }
    res.json({ success: true, data: section });
  } catch (error) { next(error); }
};

export const createSection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scope = getSchoolScope(req) as any;
    const section = await prisma.section.create({
      data: { 
        ...req.body, 
        schoolId: scope.schoolId || req.user?.schoolId 
      }
    });
    res.status(201).json({ success: true, data: section });
  } catch (error) { next(error); }
};


export const updateSection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await prisma.section.update({
      where: { id: id as string, ...getSchoolScope(req) },
      data: req.body
    });
    res.json({ success: true, data: section });
  } catch (error) { next(error); }
};


export const deleteSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.section.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) { next(error); }
};

// ── Homework ──────────────────────────────────────────
export const getHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, sectionId, subjectId } = req.query as Record<string, string>;
    const authUser = req.user!;
    
    const where: any = {
      AND: [
        classId ? { classId } : {},
        sectionId ? { sectionId } : {},
        subjectId ? { subjectId } : {}
      ]
    };

    if (authUser.role === 'student') {
      const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
      if (student) {
        where.AND.push({ classId: student.classId });
        if (student.sectionId) where.AND.push({ OR: [{ sectionId: student.sectionId }, { sectionId: null }] });
      }
    } else if (authUser.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ 
        where: { userId: authUser.id },
        include: { classTeacherOf: { select: { id: true } } }
      });
      if (teacher) {
        // Teachers see what they assigned OR if they are the class teacher of that section
        const sectionIds = teacher.classTeacherOf.map(s => s.id);
        where.AND.push({
          OR: [
            { assignedById: teacher.id },
            { sectionId: { in: sectionIds } }
          ]
        });
      }
    }

    const homework = await prisma.homework.findMany({
      where,
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        assignedBy: { include: { user: { select: { name: true } } } }
      },
      orderBy: { assignedDate: 'desc' }
    });
    res.json({ success: true, data: homework });
  } catch (error) { next(error); }
};

export const createHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = req.user!;
    const teacher = await prisma.teacher.findUnique({ 
        where: { userId: authUser.id },
        include: { 
          classTeacherOf: { select: { id: true } },
          subjects: { select: { id: true, classId: true } }
        }
    });
    
    if (!teacher) { next(createError('Only teachers can assign homework', 403)); return; }

    const isClassTeacher = teacher.classTeacherOf.some(s => s.id === req.body.sectionId);
    const isSubjectTeacher = teacher.subjects.some(s => s.classId === req.body.classId && s.id === req.body.subjectId);
    
    if (!isClassTeacher && !isSubjectTeacher && authUser.role !== 'admin' && authUser.role !== 'super_admin') {
       next(createError('Unauthorized: You must be either the Class Teacher of this section or the Subject Teacher for this specific subject to assign homework.', 403));
       return;
    }

    const homework = await prisma.homework.create({
      data: {
        ...req.body,
        assignedById: teacher.id,
        assignedDate: req.body.assignedDate || new Date(),
        dueDate: new Date(req.body.dueDate),
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      }
    });
    res.status(201).json({ success: true, data: homework });
  } catch (error) { next(error); }
};

// ── Timetable ─────────────────────────────────────────
export const getTimetables = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, sectionId } = req.query as Record<string, string>;
    const authUser = req.user!;

    const where: any = {
      AND: [
        classId ? { classId } : {},
        sectionId ? { sectionId } : {}
      ]
    };

    if (authUser.role === 'student') {
      const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
      if (student) {
        where.AND.push({ classId: student.classId });
        where.AND.push({ sectionId: student.sectionId });
      }
    } else if (authUser.role === 'teacher') {
      // If teacher explicitly selected a class/section, let them view it
      // Only restrict when no filter is provided (auto-loading their own schedule)
      if (!classId && !sectionId) {
        const teacher = await prisma.teacher.findUnique({ 
          where: { userId: authUser.id },
          include: { 
            assignedClasses: { select: { id: true } },
            classTeacherOf: { select: { id: true } }
          }
        });
        if (teacher) {
          const assignedClassIds = teacher.assignedClasses.map(c => c.id);
          const sectionIds = teacher.classTeacherOf.map(s => s.id);
          
          where.AND.push({
            OR: [
              { classId: { in: assignedClassIds } },
              { sectionId: { in: sectionIds } },
              { entries: { some: { teacherId: teacher.id } } }
            ]
          });
        }
      }
    }

    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        entries: {
          include: {
            subject: { select: { name: true, type: true } },
            teacher: { include: { user: { select: { name: true } } } }
          }
        }
      }
    });
    res.json({ success: true, data: timetables });
  } catch (error) { next(error); }
};

export const createTimetable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { classId, sectionId, academicYearId, fileUrl, notes, entries } = req.body;

    // Resolve current academic year if needed
    if (academicYearId === 'current' || !academicYearId) {
      const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, ...getSchoolScope(req) } });
      academicYearId = currentYear?.id || "";
    }

    // 1. Upsert the Timetable parent
    const timetable = await prisma.timetable.upsert({
      where: {
        sectionId_academicYearId: {
          sectionId,
          academicYearId
        }
      },
      update: {
        fileUrl,
        notes,
        classId,
      },
      create: {
        classId,
        sectionId,
        academicYearId,
        fileUrl,
        notes,
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      }
    });

    // 2. If grid entries are provided, clear old ones and create new
    // If it's PDF mode (fileUrl provided), usually entries will be empty anyway
    if (entries && entries.length > 0) {
      await prisma.timetableEntry.deleteMany({
        where: { timetableId: timetable.id }
      });

      await prisma.timetableEntry.createMany({
        data: entries.map((e: any) => ({
          ...e,
          timetableId: timetable.id
        }))
      });
    } else if (fileUrl) {
      // In PDF mode, clear any existing grid entries to avoid confusion
      await prisma.timetableEntry.deleteMany({
        where: { timetableId: timetable.id }
      });
    }

    res.status(201).json({ success: true, data: timetable });
  } catch (error) { next(error); }
};
