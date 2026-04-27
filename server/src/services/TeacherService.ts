import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { createError } from '../middleware/errorHandler';

export class TeacherService {
  static async createTeacher(data: any, schoolId?: string) {
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();
    const { email, phone, qualification, joiningDate, status } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Generate Credentials
      const name = `${firstName} ${lastName}`;
      const prefix = firstName.toLowerCase().replace(/\s/g, '');
      // Include schoolId prefix to avoid collisions across schools
      const schoolPrefix = schoolId ? schoolId.substring(0, 4) : 'sys';
      const loginEmail = `tea.${prefix}.${schoolPrefix}@school.local`;
      
      // Check if email exists
      let existingUser = await tx.user.findUnique({ where: { email: loginEmail } });
      let finalEmail = loginEmail;
      if (existingUser) {
        // Add random number if collision
        finalEmail = `tea.${prefix}.${schoolPrefix}${Math.floor(Math.random() * 1000)}@school.local`;
      }

      const rawPassword = `TEA@${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      // 2. Create User Record
      const user = await tx.user.create({
        data: {
          name,
          email: finalEmail,
          password: hashedPassword,
          role: 'teacher',
          phone: phone,
          isActive: status === 'active',
          schoolId
        }
      });

      // 3. Create Teacher Record
      // Count per school for employeeId sequence
      const count = await tx.teacher.count({ where: { schoolId } });
      const employeeId = `EMP-TCH-${schoolPrefix.toUpperCase()}-${String(count + 1).padStart(3, '0')}`;
      
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          designation: data.designation || 'Teacher',
          qualification,
          joiningDate: new Date(joiningDate),
          status: status || 'active',
          schoolId,
          canViewAllStudents: !!data.canViewAllStudents,
          assignedClasses: data.assignedClassIds ? {
            connect: data.assignedClassIds.map((id: string) => ({ id }))
          } : undefined,
          classTeacherOf: data.sectionsAsClassTeacher ? {
            connect: data.sectionsAsClassTeacher.map((id: string) => ({ id }))
          } : undefined
        }
      });

      return {
        teacher,
        credentials: {
          email: finalEmail,
          password: rawPassword,
          employeeId
        }
      };
    });
  }
}
