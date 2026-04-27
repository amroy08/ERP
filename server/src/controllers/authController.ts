import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { ROLE_PERMISSIONS } from '../config/constants';
import { AuthRequest } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';

const generateTokens = (userId: string, schoolId?: string | null) => {
  const accessToken = jwt.sign(
    { id: userId, schoolId: schoolId || null },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { id: userId, schoolId: schoolId || null },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        student: {
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            assignedFees: {
              include: { feeStructure: true }
            },
            feePayments: true
          }
        },
        teacher: {
          select: { id: true }
        },
        parent: { include: { children: { select: { id: true, fullName: true, admissionNumber: true, classId: true, sectionId: true, class: { select: { id: true, name: true } }, section: { select: { id: true, name: true } } } } } }
      }
    });

    if (user?.student) {
      // 1. Get assigned fees
      const totalAssigned = user.student.assignedFees.reduce((acc: number, fee: any) => acc + (fee.customAmount ?? fee.feeStructure.totalAmount), 0);
      
      let totalFees = totalAssigned;
      
      // 2. If no assigned fees, fallback to class fees (matches FeeService logic)
      if (user.student.assignedFees.length === 0) {
        const classFees = await prisma.feeStructure.findMany({
          where: { 
            OR: [
              { classId: user.student.classId },
              { classId: null }
            ],
            isActive: true 
          }
        });
        totalFees = classFees.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
      }

      const totalPaid = user.student.feePayments.reduce((acc: number, p: any) => acc + p.amountPaid, 0);
      (user.student as any).balanceDue = Math.max(0, totalFees - totalPaid);
    }

    console.log('Login attempt for:', email, 'User found:', !!user);

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    // ── License Gate: check if the user's role is licensed ──
    const bypassRoles = ['super_admin', 'admin'];
    if (!bypassRoles.includes(user.role)) {
      const schoolForLicense = await prisma.school.findFirst();
      const licensedRoles = (schoolForLicense?.licensedRoles as string[]) || [];
      // Map prisma Role enum to license role keys
      const roleLicenseMap: Record<string, string> = {
        teacher: 'teacher',
        clerk: 'staff',
        principal: 'admin', // principals always allowed like admin
        parent: 'parent',
        student: 'student',
      };
      const licenseKey = roleLicenseMap[user.role] || user.role;
      if (licensedRoles.length > 0 && !licensedRoles.includes(licenseKey) && licenseKey !== 'admin') {
        res.status(403).json({ 
          success: false, 
          message: `Your institution's subscription does not include access for the ${user.role.replace('_', ' ')} role. Please contact your administrator to upgrade the plan.` 
        });
        return;
      }
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.schoolId);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        refreshToken: refreshToken
      }
    });

    const permissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
    // Load the user's specific school, or the first school for super_admin
    const school = user.schoolId 
      ? await prisma.school.findUnique({ where: { id: user.schoolId } })
      : await prisma.school.findFirst();

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto,
          phone: user.phone,
          schoolId: user.schoolId,
          student: user.student,
          parent: user.parent,
          permissions,
        },
        school,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.refreshToken !== token) {
      res.status(401).json({ success: false, message: 'Invalid refresh token.' });
      return;
    }

    const tokens = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id as string },
      include: {
        student: {
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            assignedFees: {
              include: { feeStructure: true }
            },
            feePayments: true
          }
        },
        teacher: {
          select: { id: true }
        },
        parent: { include: { children: { select: { id: true, fullName: true, admissionNumber: true, classId: true, sectionId: true, class: { select: { id: true, name: true } }, section: { select: { id: true, name: true } } } } } }
      }
    });

    if (!user) { next(createError('User not found', 404)); return; }

    if (user.student) {
      const totalFees = user.student.assignedFees.reduce((acc: number, fee: any) => acc + (fee.customAmount ?? fee.feeStructure.totalAmount), 0);
      const totalPaid = user.student.feePayments.reduce((acc: number, p: any) => acc + p.amountPaid, 0);
      (user.student as any).balanceDue = totalFees - totalPaid;
    }

    const permissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
    const school = await prisma.school.findFirst();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto,
          phone: user.phone,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          student: user.student,
          teacher: user.teacher,
          parent: user.parent,
          permissions
        },
        permissions,
        school
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id as string }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};
