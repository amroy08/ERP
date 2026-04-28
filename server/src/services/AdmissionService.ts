import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { createError } from '../middleware/errorHandler';

export class AdmissionService {
  static async convertToStudent(
    admissionId: string, 
    createdBy: string,
    options: { classId?: string; sectionId?: string } = {},
    schoolId?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch admission details
      const admission = await tx.admission.findUnique({
        where: { id: admissionId }
      });

      if (!admission) throw createError('Admission application not found', 404);
      
      // 2. Create/Find Parent User and Record
      const admissionNum = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const parentEmail = admission.parentEmail || `${admissionNum.toLowerCase()}.parent@school.local`;
      
      let parentUser = await tx.user.findUnique({ where: { email: parentEmail } });
      let parent;

      if (!parentUser) {
        const hashedParentPassword = await bcrypt.hash('Parent@123', 10);
        parentUser = await tx.user.create({
          data: {
            name: admission.fatherName || admission.parentName,
            email: parentEmail,
            password: hashedParentPassword,
            role: 'parent',
            phone: admission.fatherPhone || admission.parentPhone,
            schoolId: schoolId || admission.schoolId
          }
        });
      }

      parent = await tx.parent.findFirst({ where: { userId: parentUser.id } });
      if (!parent) {
        parent = await tx.parent.create({
          data: {
            userId: parentUser.id,
            fatherName: admission.fatherName || admission.parentName,
            fatherPhone: admission.fatherPhone || admission.parentPhone,
            motherName: admission.motherName || '',
            motherPhone: admission.motherPhone || '',
            address: admission.address || 'Address to be updated',
            schoolId: schoolId || admission.schoolId
          }
        });
      }

      // 3. Create Student User and Record
      const studentEmail = `stu.${admissionNum.toLowerCase().replace(/-/g, '')}@school.local`;
      const rawStudentPassword = `STU@${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedStudentPassword = await bcrypt.hash(rawStudentPassword, 10);
      
      const studentUser = await tx.user.create({
        data: {
          name: `${admission.firstName} ${admission.lastName}`,
          email: studentEmail,
          password: hashedStudentPassword,
          role: 'student',
          schoolId: schoolId || admission.schoolId
        }
      });

      const student = await tx.student.create({
        data: {
          userId: studentUser.id,
          admissionNumber: admissionNum,
          firstName: admission.firstName,
          lastName: admission.lastName,
          fullName: `${admission.firstName} ${admission.lastName}`,
          dateOfBirth: admission.dateOfBirth,
          gender: admission.gender,
          parentId: parent.id,
          classId: options.classId || admission.classId,
          sectionId: options.sectionId || admission.sectionId || '',
          academicYearId: admission.academicYearId,
          aadhaarNumber: admission.aadhaarNumber || null,
          previousSchool: admission.previousSchool || null,
          status: 'active',
          schoolId: schoolId || admission.schoolId
        }
      });

      // 4. Link Assigned Fees to Student
      const admissionFees = await tx.admissionFee.findMany({
        where: { admissionId }
      });

      if (admissionFees.length > 0) {
        await tx.studentFee.createMany({
          data: admissionFees.map(af => ({
            studentId: student.id,
            feeStructureId: af.feeStructureId,
            customAmount: af.customAmount,
            schoolId: schoolId || admission.schoolId
          }))
        });
      }

      // 5. Update Admission Status
      await tx.admission.update({
        where: { id: admissionId },
        data: { status: 'enrolled' }
      });

      return {
        student,
        credentials: {
          student: {
            email: studentEmail,
            password: rawStudentPassword,
            admissionNumber: admissionNum
          },
          parent: {
            email: parentEmail,
            password: 'Parent@123 (Or existing)',
          }
        }
      };
    });
  }
}
