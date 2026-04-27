import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

// ── List all schools (super_admin only) ────────────────────────
export const getAllSchools = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
          }
        }
      }
    });

    // Enrich with role counts
    const enriched = await Promise.all(schools.map(async (school) => {
      const roleCounts = await prisma.user.groupBy({
        by: ['role'],
        where: { schoolId: school.id },
        _count: true,
      });
      const counts: Record<string, number> = {};
      roleCounts.forEach(r => { counts[r.role] = r._count; });
      return {
        ...school,
        roleCounts: counts,
        totalUsers: school._count.users,
        totalClasses: school._count.classes,
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) { next(error); }
};

// ── Get single school detail ─────────────────────────────────
export const getSchoolDetail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.params.id as string },
      include: {
        _count: {
          select: { users: true, classes: true }
        }
      }
    });
    if (!school) {
      next(createError('School not found', 404));
      return;
    }

    // Get admin user for this school
    const adminUser = await prisma.user.findFirst({
      where: { schoolId: school.id, role: 'admin' },
      select: { id: true, name: true, email: true, lastLogin: true }
    });

    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      where: { schoolId: school.id },
      _count: true,
    });
    const counts: Record<string, number> = {};
    roleCounts.forEach(r => { counts[r.role] = r._count; });

    res.json({ 
      success: true, 
      data: { ...school, adminUser, roleCounts: counts } 
    });
  } catch (error) { next(error); }
};

// ── Create a new school ─────────────────────────────────────
export const createSchool = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, address, phone, email, website, principal, affiliation, tagline, licensedRoles, enabledModules, licensePlan, adminName, adminEmail, adminPassword } = req.body;

    if (!name || !address || !phone || !email) {
      next(createError('Name, address, phone, and email are required.', 400));
      return;
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const existingSlug = await prisma.school.findUnique({ where: { slug } });
    if (existingSlug) {
      next(createError('A school with a similar name already exists.', 400));
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the school
      const school = await tx.school.create({
        data: {
          name,
          address,
          phone,
          email,
          website: website || null,
          principal: principal || null,
          affiliation: affiliation || null,
          tagline: tagline || null,
          slug,
          enabledModules: enabledModules || ['attendance','homework','exams','timetable','fees','notices','library','inventory','transport','admissions'],
          licensedRoles: licensedRoles || ['admin'],
          licensePlan: licensePlan || 'starter',
        }
      });

      // 2. Create admin user for this school (if provided)
      let adminUser = null;
      if (adminEmail) {
        const existingUser = await tx.user.findUnique({ where: { email: adminEmail } });
        if (existingUser) {
          throw createError('Admin email already exists in the system.', 400);
        }

        const hashedPassword = await bcrypt.hash(adminPassword || 'Admin@123', 12);
        adminUser = await tx.user.create({
          data: {
            name: adminName || `${name} Admin`,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            schoolId: school.id,
          }
        });
      }

      // 3. Create default classes (1-12) for the school
      const defaultClasses = [];
      for (let i = 1; i <= 12; i++) {
        const cls = await tx.class.create({
          data: {
            name: `Class ${i}`,
            numericValue: i,
            schoolId: school.id,
          }
        });
        defaultClasses.push(cls);
      }

      return { school, adminUser, classesCreated: defaultClasses.length };
    });

    res.status(201).json({
      success: true,
      message: `School "${name}" created with ${result.classesCreated} classes.`,
      data: result,
    });
  } catch (error) { next(error); }
};

// ── Update school licensing / settings ──────────────────────
export const updateSchool = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const school = await prisma.school.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: school });
  } catch (error) { next(error); }
};

// ── Delete a school ─────────────────────────────────────────
export const deleteSchool = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Safety check: don't delete schools with active users
    const userCount = await prisma.user.count({ where: { schoolId: id } });
    if (userCount > 0) {
      next(createError(`Cannot delete school with ${userCount} active users. Remove users first.`, 400));
      return;
    }

    await prisma.school.delete({ where: { id } });
    res.json({ success: true, message: 'School deleted successfully.' });
  } catch (error) { next(error); }
};

// ── Create admin account for a school ───────────────────────
export const createSchoolAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, email, password } = req.body;

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      next(createError('School not found', 404));
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      next(createError('Email already exists.', 400));
      return;
    }

    const hashedPassword = await bcrypt.hash(password || 'Admin@123', 12);
    const adminUser = await prisma.user.create({
      data: {
        name: name || `${school.name} Admin`,
        email,
        password: hashedPassword,
        role: 'admin',
        schoolId: id,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      data: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        defaultPassword: password || 'Admin@123',
      }
    });
  } catch (error) { next(error); }
};
