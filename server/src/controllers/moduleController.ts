import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';
import { AdmissionService } from '../services/AdmissionService';
import { TeacherService } from '../services/TeacherService';
import { ArchiveService } from '../services/ArchiveService';
import { NotificationService } from '../services/NotificationService';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { getSchoolScope } from '../utils/schoolScope';
import { requireFields, VALID_ATTENDANCE_STATUSES } from '../utils/validate';

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
    const { search, status, schoolId } = req.query as Record<string, string>;
    const scope = getSchoolScope(req);
    const teachers = await prisma.teacher.findMany({
      where: {
        AND: [
          schoolId && req.user?.role === 'super_admin' ? { schoolId } : {},
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
        classTeacherOf: { select: { id: true, name: true, class: { select: { name: true } } } },
        school: { select: { name: true } }
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
      return next(createError(licenseError, 403));
    }
    const scopedSchoolId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    const result = await TeacherService.createTeacher(req.body, scopedSchoolId || undefined);

    // Welcome teacher email fire-and-forget
    const targetEmail = req.body.email || result.credentials.email;
    NotificationService.notifyWelcomeUser({
      to: targetEmail,
      name: `${req.body.firstName} ${req.body.lastName}`,
      role: 'teacher',
      loginEmail: result.credentials.email,
      password: result.credentials.password,
      schoolId: scopedSchoolId || undefined,
      recipientUserId: result.teacher.userId
    }).catch((err) => {
      console.error('[NotificationTrigger] Welcome teacher email notification failed:', err);
    });

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
    const existingTeacher = await prisma.teacher.findFirst({
      where: { id: teacherId as string, ...getSchoolScope(req as any) },
      select: { userId: true }
    });

    if (!existingTeacher) {
      next(createError('Teacher not found', 404));
      return;
    }

    const updatedTeacher = await prisma.$transaction(async (tx) => {
      // 1. Update Teacher Record
      const t = await tx.teacher.update({
        where: { id: teacherId as string, ...getSchoolScope(req as any) },
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
    const scopedId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    const result = await ArchiveService.moveToArchive('teacher', req.params.id as string, req.user?.id, scopedId);
    res.json({ success: true, message: `Teacher ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

export const resetTeacherPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacher = await prisma.teacher.findFirst({
      where: { id: req.params.id as string, ...getSchoolScope(req as any) },
      include: { user: { select: { name: true, email: true, schoolId: true } } }
    });

    if (!teacher || !teacher.userId || !teacher.user) {
      next(createError('Teacher user account not found', 404));
      return;
    }

    const defaultPassword = 'Teacher@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await prisma.user.update({
      where: { id: teacher.userId },
      data: { password: hashedPassword }
    });

    // Password reset email fire-and-forget
    NotificationService.notifyPasswordReset({
      to: teacher.user.email,
      name: teacher.user.name,
      role: 'teacher',
      loginEmail: teacher.user.email,
      password: defaultPassword,
      schoolId: teacher.user.schoolId || undefined,
      recipientUserId: teacher.userId
    }).catch((err) => {
      console.error('[NotificationTrigger] Teacher password reset notification failed:', err);
    });

    res.json({ success: true, message: 'Password reset to Teacher@123' });
  } catch (error) { next(error); }
};

export const resetStaffPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id as string, ...getSchoolScope(req as any) },
      include: { user: { select: { name: true, email: true, schoolId: true } } }
    });

    if (!staff || !staff.userId || !staff.user) {
      next(createError('Staff user account not found', 404));
      return;
    }

    const defaultPassword = 'Staff@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await prisma.user.update({
      where: { id: staff.userId },
      data: { password: hashedPassword }
    });

    // Password reset email fire-and-forget
    NotificationService.notifyPasswordReset({
      to: staff.user.email,
      name: staff.user.name,
      role: 'staff',
      loginEmail: staff.user.email,
      password: defaultPassword,
      schoolId: staff.user.schoolId || undefined,
      recipientUserId: staff.userId
    }).catch((err) => {
      console.error('[NotificationTrigger] Staff password reset notification failed:', err);
    });

    res.json({ success: true, message: 'Password reset to Staff@123' });
  } catch (error) { next(error); }
};

// ── Staff ─────────────────────────────────────────────
export const getStaff = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, schoolId } = req.query as Record<string, string>;
    const scope = getSchoolScope(req);
    const staff = await prisma.staff.findMany({
      where: {
        AND: [
          schoolId && req.user?.role === 'super_admin' ? { schoolId } : {},
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
        user: { select: { name: true, email: true, profilePhoto: true, phone: true } },
        school: { select: { name: true } }
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
      return next(createError(licenseError, 403));
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

    // Welcome staff email fire-and-forget
    const targetEmail = req.body.email || result.credentials.email;
    NotificationService.notifyWelcomeUser({
      to: targetEmail,
      name: `${firstName} ${lastName}`,
      role: 'staff',
      loginEmail: result.credentials.email,
      password: result.credentials.password,
      schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId,
      recipientUserId: result.staff.userId
    }).catch((err) => {
      console.error('[NotificationTrigger] Welcome staff email notification failed:', err);
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

export const updateStaff = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffId = req.params.id as string;

    // Verify the staff record exists and belongs to this school
    const existingStaff = await prisma.staff.findFirst({
      where: { id: staffId, ...getSchoolScope(req) },
      select: { id: true, userId: true }
    });
    if (!existingStaff) {
      next(createError('Staff member not found', 404));
      return;
    }

    // Whitelist only safe, editable staff profile fields
    const { department, designation, status, joiningDate, employeeId, firstName, lastName, email, phone } = req.body;

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        ...(department !== undefined ? { department } : {}),
        ...(designation !== undefined ? { designation } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(joiningDate !== undefined ? { joiningDate: new Date(joiningDate) } : {}),
        ...(employeeId !== undefined ? { employeeId } : {}),
      }
    });

    // Update linked user's safe fields if provided
    if (existingStaff.userId && (firstName || lastName || email || phone)) {
      await prisma.user.update({
        where: { id: existingStaff.userId },
        data: {
          ...(firstName && lastName ? { name: `${firstName} ${lastName}` } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        }
      }).catch(() => {}); // Silently fail on email conflict
    }

    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};

export const deleteStaff = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scopedId = (getSchoolScope(req as any) as any).schoolId || (req as any).user?.schoolId;
    const result = await ArchiveService.moveToArchive('staff', req.params.id as string, req.user?.id, scopedId);
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
    const scopedId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    const result = await ArchiveService.moveToArchive('parent', req.params.id as string, req.user?.id, scopedId);
    res.json({ success: true, message: `Guardian record for ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

// ── System Archive ────────────────────────────────────
export const getArchives = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.query;
    const authUser = (req as AuthRequest).user;

    // Archive model has no schoolId column — build a safe filter instead.
    // For non-super_admin users, filter archives to only those deleted by users
    // in their school (using the stored deletedBy user ID).
    let schoolUserIds: string[] | undefined;
    if (authUser?.role !== 'super_admin' && authUser?.schoolId) {
      const schoolUsers = await prisma.user.findMany({
        where: { schoolId: authUser.schoolId },
        select: { id: true }
      });
      schoolUserIds = schoolUsers.map(u => u.id);
    }

    const archives = await (prisma as any).archive.findMany({
      where: {
        AND: [
          type ? { entityType: type as string } : {},
          schoolUserIds ? { deletedBy: { in: schoolUserIds } } : {}
        ]
      },
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

export const purgeArchive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const archive = await (prisma as any).archive.findUnique({ where: { id: req.params.id as string } });
    if (!archive) {
      next(createError('Archive record not found', 404));
      return;
    }

    // Super admin can purge any record
    if (req.user?.role !== 'super_admin') {
      // For school-level users, verify the archived record belongs to their school
      const archivedData = archive.data as any;
      const archivedSchoolId = archivedData?.schoolId;

      if (!archivedSchoolId || archivedSchoolId !== req.user?.schoolId) {
        next(createError('Access denied. You can only purge records belonging to your school.', 403));
        return;
      }
    }

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
      where: {
        AND: [
          getSchoolScope(req),
          filter
        ]
      },
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

    // Required: title
    const fieldErr = requireFields(req.body, ['title']);
    if (fieldErr) return next(fieldErr);

    if (req.file) {
      fileUrl = `/uploads/notices/${req.file.filename}`;
    }

    const notice = await prisma.notice.create({
      data: { 
        title: title.trim(), 
        content: content || '', 
        targetRoles: Array.isArray(audience) ? audience.join(',') : (audience || targetRoles || 'all'),
        priority: priority || 'normal',
        type: type || (req.file ? 'file' : 'text'),
        fileUrl,
        createdBy: req.user!.id,
        schoolId: (getSchoolScope(req) as any).schoolId || req.user?.schoolId
      }
    });

    NotificationService.notifyNoticePublished(notice).catch((error) => {
      console.error('Notice email notification failed:', error);
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
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data: updateData
    });
    res.json({ success: true, data: notice });
  } catch (error) { next(error); }
};

export const deleteNotice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scopedId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    const result = await ArchiveService.moveToArchive('notice', req.params.id as string, req.user?.id, scopedId);
    res.json({ success: true, message: `Notice "${result.name}" archived successfully` });
  } catch (error) { next(error); }
};

// ── Enquiries ─────────────────────────────────────────
export const getEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query as Record<string, string>;
    const enquiries = await prisma.enquiry.findMany({
      where: {
        AND: [
          getSchoolScope(req),
          status ? { status } : {}
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: enquiries });
  } catch (error) { next(error); }
};

export const createEnquiry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = (getSchoolScope(req) as any).schoolId || (req as any).user?.schoolId;

    // Required fields (matches Enquiry schema: studentName, parentName, phone)
    const fieldErr = requireFields(req.body, ['studentName', 'parentName', 'phone']);
    if (fieldErr) return next(fieldErr);

    // Whitelist safe fields (no mass assignment) — must match Enquiry model
    const { studentName, parentName, phone, email, class: enquiryClass, message, source, status } = req.body;
    const enquiry = await prisma.enquiry.create({
      data: { studentName, parentName, phone, email, class: enquiryClass, message, source,
               status: status || 'new', schoolId }
    });
    res.status(201).json({ success: true, data: enquiry });
  } catch (error) { next(error); }
};

export const updateEnquiry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const VALID_STATUSES = ['new', 'contacted', 'interested', 'converted', 'not_interested', 'follow_up'];

    // Whitelist updatable fields (must match Enquiry schema)
    const { status, message, source, class: enquiryClass, phone, email } = req.body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return next(createError(`Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}.`, 400));
    }

    const enquiry = await prisma.enquiry.update({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data: { status, message, source, class: enquiryClass, phone, email }
    });
    res.json({ success: true, data: enquiry });
  } catch (error) { next(error); }
};

// ── Admissions ────────────────────────────────────────
export const getAdmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, schoolId } = req.query as Record<string, string>;
    const admissions = await prisma.admission.findMany({
      where: {
        AND: [
          getSchoolScope(req),
          schoolId && (req as any).user?.role === 'super_admin' ? { schoolId } : {},
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
      where: { id: req.params.id as string, ...getSchoolScope(req) },
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

    const {
      feeAssignments,
      dateOfBirth,
      previousMarks,
      fatherAnnualIncome,
      motherAnnualIncome,
      transportRequired,
      hostelRequired,
      ...admissionData
    } = req.body;
    
    const data: any = {
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
    };

    if (previousMarks !== undefined && previousMarks !== null && previousMarks !== '') {
      data.previousMarks = parseFloat(previousMarks as string);
    }
    if (fatherAnnualIncome !== undefined && fatherAnnualIncome !== null && fatherAnnualIncome !== '') {
      data.fatherAnnualIncome = parseFloat(fatherAnnualIncome as string);
    }
    if (motherAnnualIncome !== undefined && motherAnnualIncome !== null && motherAnnualIncome !== '') {
      data.motherAnnualIncome = parseFloat(motherAnnualIncome as string);
    }
    if (transportRequired !== undefined && transportRequired !== null) {
      data.transportRequired = String(transportRequired) === 'true' || transportRequired === true;
    }
    if (hostelRequired !== undefined && hostelRequired !== null) {
      data.hostelRequired = String(hostelRequired) === 'true' || hostelRequired === true;
    }

    const admission = await prisma.admission.create({ data });

    // Fire-and-forget notification for admission submitted
    NotificationService.notifyAdmissionSubmitted(admission).catch((err) => {
      console.error('[NotificationTrigger] Admission submitted email notification failed:', err);
    });

    res.status(201).json({ success: true, data: admission });
  } catch (error) { next(error); }
};

export const updateAdmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      feeAssignments,
      dateOfBirth,
      previousMarks,
      fatherAnnualIncome,
      motherAnnualIncome,
      transportRequired,
      hostelRequired,
      ...admissionData
    } = req.body;
    
    const existing = await prisma.admission.findUnique({
      where: { id: req.params.id as string, ...getSchoolScope(req) }
    });
    if (!existing) {
      next(createError('Admission not found', 404));
      return;
    }

    const data: any = {
      ...admissionData,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      assignedFees: feeAssignments ? {
        deleteMany: {}, // Clear existing assignments
        create: feeAssignments.map((fa: { feeStructureId: string; amount: number }) => ({ 
          feeStructureId: fa.feeStructureId,
          customAmount: fa.amount
        }))
      } : undefined
    };

    if (previousMarks !== undefined) {
      data.previousMarks = previousMarks === null || previousMarks === '' ? null : parseFloat(previousMarks as string);
    }
    if (fatherAnnualIncome !== undefined) {
      data.fatherAnnualIncome = fatherAnnualIncome === null || fatherAnnualIncome === '' ? null : parseFloat(fatherAnnualIncome as string);
    }
    if (motherAnnualIncome !== undefined) {
      data.motherAnnualIncome = motherAnnualIncome === null || motherAnnualIncome === '' ? null : parseFloat(motherAnnualIncome as string);
    }
    if (transportRequired !== undefined) {
      data.transportRequired = transportRequired === null ? null : (String(transportRequired) === 'true' || transportRequired === true);
    }
    if (hostelRequired !== undefined) {
      data.hostelRequired = hostelRequired === null ? null : (String(hostelRequired) === 'true' || hostelRequired === true);
    }

    const admission = await prisma.admission.update({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      data
    });

    // Trigger email notifications fire-and-forget on status change
    const wasApproved = existing.status === 'approved' || existing.status === 'accepted';
    const isApprovedNow = admission.status === 'approved' || admission.status === 'accepted';
    if (!wasApproved && isApprovedNow) {
      NotificationService.notifyAdmissionApproved(admission).catch((err) => {
        console.error('[NotificationTrigger] Admission approved email notification failed:', err);
      });
    } else if (existing.status !== 'rejected' && admission.status === 'rejected') {
      NotificationService.notifyAdmissionRejected(admission).catch((err) => {
        console.error('[NotificationTrigger] Admission rejected email notification failed:', err);
      });
    }

    res.json({ success: true, data: admission });
  } catch (error) { next(error); }
};

export const convertAdmissionToStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const schoolId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    const result = await AdmissionService.convertToStudent(id as string, req.user!.id as string, req.body, schoolId);

    // Trigger student enrollment email fire-and-forget
    NotificationService.notifyStudentEnrolled(result.student, result.credentials).catch((err) => {
      console.error('[NotificationTrigger] Student enrolled email notification failed:', err);
    });

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// Helper to map DB section model capacity to UI maxStrength
const mapSection = (sec: any) => {
  if (!sec) return sec;
  return {
    ...sec,
    maxStrength: sec.capacity
  };
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

    const mappedClasses = classes.map(c => ({
      ...c,
      sections: c.sections?.map(mapSection)
    }));

    res.json({ success: true, data: mappedClasses });
  } catch (error) { next(error); }
};


export const createClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scope = getSchoolScope(req) as any;
    const schoolId = scope.schoolId || req.user?.schoolId;

    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, ...scope } });
    if (!academicYear) { next(createError('No active academic year', 400)); return; }

    // Required: class name
    const fieldErr = requireFields(req.body, ['name']);
    if (fieldErr) return next(fieldErr);

    // Duplicate class name in same school
    const dupClass = await prisma.class.findFirst({
      where: { name: req.body.name.trim(), schoolId }
    });
    if (dupClass) {
      return next(createError(`A class named "${req.body.name}" already exists in this school.`, 409));
    }

    const cls = await prisma.class.create({ 
      data: { ...req.body, schoolId }
    });
    res.status(201).json({ success: true, data: cls });
  } catch (error) { next(error); }
};


export const updateClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const schoolId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;

    // Required: class name
    const fieldErr = requireFields(req.body, ['name']);
    if (fieldErr) return next(fieldErr);

    // Duplicate class name in same school (skip self)
    const dupClass = await prisma.class.findFirst({
      where: { name: req.body.name.trim(), schoolId, NOT: { id: id as string } }
    });
    if (dupClass) {
      return next(createError(`A class named "${req.body.name}" already exists in this school.`, 409));
    }

    const cls = await prisma.class.update({
      where: { id: id as string, ...getSchoolScope(req) },
      data: req.body
    });
    res.json({ success: true, data: cls });
  } catch (error) { next(error); }
};


export const deleteClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scopedId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;
    const result = await ArchiveService.moveToArchive('class', req.params.id as string, req.user?.id, scopedId);
    res.json({ success: true, message: `Class ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

// ── Subjects ──────────────────────────────────────────
export const getSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      where: getSchoolScope(req as any),
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

export const createSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = (getSchoolScope(req as any) as any).schoolId || (req as any).user?.schoolId;

    // Required: subject name
    const fieldErr = requireFields(req.body, ['name']);
    if (fieldErr) return next(fieldErr);

    // Validate class belongs to this school (if classId provided)
    if (req.body.classId) {
      const cls = await prisma.class.findFirst({ where: { id: req.body.classId, schoolId } });
      if (!cls) return next(createError('Selected class not found in this school.', 400));
    }

    // Validate teacherId belongs to this school (if provided)
    if (req.body.teacherId) {
      const tch = await prisma.teacher.findFirst({ where: { id: req.body.teacherId, schoolId } });
      if (!tch) return next(createError('Selected teacher not found in this school.', 400));
    }

    // Duplicate subject name in same class
    const dupSubject = await prisma.subject.findFirst({
      where: { name: req.body.name.trim(), classId: req.body.classId || null, schoolId }
    });
    if (dupSubject) {
      return next(createError(`A subject named "${req.body.name}" already exists for this class.`, 409));
    }

    const subject = await prisma.subject.create({
      data: { ...req.body, schoolId }
    });
    res.status(201).json({ success: true, data: subject });
  } catch (error) { next(error); }
};

export const updateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.update({
      where: { id: id as string, ...getSchoolScope(req as any) },
      data: req.body
    });
    res.json({ success: true, data: subject });
  } catch (error) { next(error); }
};

export const deleteSubject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scopedId = (getSchoolScope(req as any) as any).schoolId || (req as any).user?.schoolId;
    const result = await ArchiveService.moveToArchive('subject', req.params.id as string, (req as any).user?.id, scopedId);
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
        getSchoolScope(req),
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

    // Validate records array
    if (!records || !Array.isArray(records) || records.length === 0) {
      return next(createError('Attendance records array is required and must not be empty.', 400));
    }

    // Validate each record's status
    for (const record of records) {
      if (!record.studentId) {
        return next(createError('Each attendance record must have a studentId.', 400));
      }
      if (!record.date) {
        return next(createError('Each attendance record must have a date.', 400));
      }
      if (!record.status || !(VALID_ATTENDANCE_STATUSES as readonly string[]).includes(record.status)) {
        return next(createError(
          `Invalid attendance status "${record.status}". Allowed values: ${VALID_ATTENDANCE_STATUSES.join(', ')}.`,
          400
        ));
      }
    }

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
    
    const absentRecords = results.filter((r: any) => r.status === 'absent');
    if (absentRecords.length > 0) {
      NotificationService.notifyAttendanceAbsent(absentRecords).catch((error) => {
        console.error('Attendance absent email notification failed:', error);
      });
    }
    
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
    const scope = getSchoolScope(req) as any;
    const schoolId = scope.schoolId || req.user?.schoolId;

    if (!schoolId) {
      next(createError('No school context found', 400));
      return;
    }

    // Strip out immutable/read-only database fields before updating
    const { id, createdAt, updatedAt, ...updateData } = req.body;

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: updateData
    });
    res.json({ success: true, data: school });
  } catch (error) { next(error); }
};

export const uploadSchoolLogo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      next(createError('No logo file uploaded', 400));
      return;
    }

    const scope = getSchoolScope(req) as any;
    const schoolId = scope.schoolId || req.user?.schoolId;
    if (!schoolId) {
      next(createError('No school context found', 400));
      return;
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Delete old logo file if it exists
    const oldSchool = await prisma.school.findUnique({ where: { id: schoolId } });
    if (oldSchool?.logo) {
      const oldPath = path.join(process.cwd(), oldSchool.logo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: { logo: logoUrl }
    });

    res.json({ success: true, data: school, message: 'Logo updated successfully' });
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
    res.json({ success: true, data: sections.map(mapSection) });
  } catch (error) { next(error); }
};


export const getSection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await prisma.section.findFirst({
      where: { id: id as string, ...getSchoolScope(req) },
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
    res.json({ success: true, data: mapSection(section) });
  } catch (error) { next(error); }
};

export const createSection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scope = getSchoolScope(req) as any;
    const schoolId = scope.schoolId || req.user?.schoolId;
    const { maxStrength, ...rest } = req.body;

    // Required: name
    const fieldErr = requireFields(req.body, ['name']);
    if (fieldErr) return next(fieldErr);

    // Validate classId belongs to this school
    if (rest.classId) {
      const cls = await prisma.class.findFirst({ where: { id: rest.classId, schoolId } });
      if (!cls) return next(createError('Selected class not found in this school.', 400));
    }

    // Capacity must be positive if provided
    if (maxStrength !== undefined) {
      const cap = Number(maxStrength);
      if (isNaN(cap) || cap <= 0) {
        return next(createError('Section capacity must be a positive number.', 400));
      }
    }

    // Duplicate section name in same class
    if (rest.classId) {
      const dupSec = await prisma.section.findFirst({
        where: { name: rest.name.trim(), classId: rest.classId, schoolId }
      });
      if (dupSec) {
        return next(createError(`A section named "${rest.name}" already exists for this class.`, 409));
      }
    }

    const section = await prisma.section.create({
      data: { 
        ...rest,
        capacity: maxStrength !== undefined ? Number(maxStrength) : undefined,
        schoolId
      }
    });
    res.status(201).json({ success: true, data: mapSection(section) });
  } catch (error) { next(error); }
};


export const updateSection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { maxStrength, ...rest } = req.body;
    const schoolId = (getSchoolScope(req) as any).schoolId || req.user?.schoolId;

    // Required: name
    const fieldErr = requireFields(req.body, ['name']);
    if (fieldErr) return next(fieldErr);

    // Capacity must be positive if provided
    if (maxStrength !== undefined) {
      const cap = Number(maxStrength);
      if (isNaN(cap) || cap <= 0) {
        return next(createError('Section capacity must be a positive number.', 400));
      }
    }

    // Duplicate section name in same class (skip self)
    if (rest.classId) {
      const dupSec = await prisma.section.findFirst({
        where: { name: rest.name.trim(), classId: rest.classId, schoolId, NOT: { id: id as string } }
      });
      if (dupSec) {
        return next(createError(`A section named "${rest.name}" already exists for this class.`, 409));
      }
    }

    const section = await prisma.section.update({
      where: { id: id as string, ...getSchoolScope(req) },
      data: {
        ...rest,
        capacity: maxStrength !== undefined ? Number(maxStrength) : undefined,
      }
    });
    res.json({ success: true, data: mapSection(section) });
  } catch (error) { next(error); }
};


export const deleteSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await prisma.section.findUnique({ where: { id: id as string } });
    if (!section) {
      next(createError('Section not found', 404));
      return;
    }

    // Check for students in this section
    const studentCount = await prisma.student.count({ where: { sectionId: id as string } });
    if (studentCount > 0) {
      next(createError(`Cannot delete section: ${studentCount} students are still assigned to it. Please reassign or remove them first.`, 400));
      return;
    }

    // Clean up related records in a transaction
    await prisma.$transaction([
      prisma.timetableEntry.deleteMany({ where: { timetable: { sectionId: id as string } } }),
      prisma.timetable.deleteMany({ where: { sectionId: id as string } }),
      prisma.homework.deleteMany({ where: { sectionId: id as string } }),
      prisma.section.delete({ where: { id: id as string } })
    ]);

    res.json({ success: true, message: `Section "${section.name}" deleted successfully` });
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
    } else if (authUser.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { userId: authUser.id },
        include: { children: { select: { classId: true, sectionId: true } } }
      });
      if (parent && parent.children.length > 0) {
        const classIds = parent.children.map(c => c.classId);
        const sectionIds = parent.children.filter(c => c.sectionId).map(c => c.sectionId as string);
        
        if (classId && !classIds.includes(classId)) {
          return next(createError('Access denied. This class is not linked to your children.', 403));
        }
        if (sectionId && !sectionIds.includes(sectionId)) {
          return next(createError('Access denied. This section is not linked to your children.', 403));
        }
        
        if (!classId) {
          where.AND.push({ classId: { in: classIds } });
        }
        if (!sectionId) {
          where.AND.push({ OR: [{ sectionId: { in: sectionIds } }, { sectionId: null }] });
        }
      } else {
        res.json({ success: true, data: [] });
        return;
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

    NotificationService.notifyHomeworkAssigned(homework).catch((error) => {
      console.error('Homework email notification failed:', error);
    });

    res.status(201).json({ success: true, data: homework });
  } catch (error) { next(error); }
};

export const deleteHomework = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const homework = await prisma.homework.findFirst({
      where: { id: id as string, ...getSchoolScope(req) }
    });
    if (!homework) {
      next(createError('Homework not found', 404));
      return;
    }
    await prisma.homework.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Homework deleted successfully' });
  } catch (error) { next(error); }
};

// ── Timetable ─────────────────────────────────────────
export const getTimetables = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, page, limit, schoolId, classId, sectionId } = req.query as Record<string, string>;
    const authUser = req.user!;
    const scope = getSchoolScope(req);
    
    const where: any = {
      ...scope,
      AND: [
        schoolId && (req as any).user?.role === 'super_admin' ? { schoolId } : {},
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
