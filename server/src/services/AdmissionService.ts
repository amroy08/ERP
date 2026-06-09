import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { createError } from '../middleware/errorHandler';
import { EnrollmentService } from './EnrollmentService';

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
      
      // Guard: only approved or accepted admissions can be converted
      if (admission.status === 'enrolled' || admission.status === 'converted') {
        throw createError('This admission has already been converted to a student record. Duplicate conversion is not allowed.', 409);
      }
      if (admission.status !== 'approved' && admission.status !== 'accepted') {
        throw createError(`Cannot convert admission with status "${admission.status}". The admission must be approved first.`, 400);
      }

      // Guard: class and section must be specified (either via options or already on admission)
      const resolvedClassId = options.classId || admission.classId;
      const resolvedSectionId = options.sectionId || admission.sectionId;
      if (!resolvedClassId) {
        throw createError('Class must be specified before converting admission to student.', 400);
      }
      if (!resolvedSectionId) {
        throw createError('Section must be specified before converting admission to student.', 400);
      }
      
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
        const parentAddressParts = [
          admission.addressStreet,
          admission.addressCity,
          admission.addressState,
          admission.addressPincode
        ].filter(Boolean);
        const resolvedParentAddress = parentAddressParts.length > 0
          ? parentAddressParts.join(', ')
          : (admission.address || 'Address to be updated');

        const resolvedAnnualIncome = admission.fatherAnnualIncome !== null && admission.fatherAnnualIncome !== undefined
          ? admission.fatherAnnualIncome
          : (admission.motherAnnualIncome !== null && admission.motherAnnualIncome !== undefined
            ? admission.motherAnnualIncome
            : null);

        parent = await tx.parent.create({
          data: {
            userId: parentUser.id,
            fatherName: admission.fatherName || admission.parentName,
            fatherPhone: admission.fatherPhone || admission.parentPhone,
            fatherOccupation: admission.fatherOccupation || null,
            motherName: admission.motherName || '',
            motherPhone: admission.motherPhone || '',
            motherOccupation: admission.motherOccupation || null,
            annualIncome: resolvedAnnualIncome,
            address: resolvedParentAddress,
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

      const medicalNotes = [];
      if (admission.medicalCondition) medicalNotes.push(`Condition: ${admission.medicalCondition}`);
      if (admission.allergies) medicalNotes.push(`Allergies: ${admission.allergies}`);
      if (admission.specialNeeds) medicalNotes.push(`Special Needs: ${admission.specialNeeds}`);
      const resolvedMedicalNote = medicalNotes.length > 0 ? medicalNotes.join('\n') : null;

      const student = await tx.student.create({
        data: {
          userId: studentUser.id,
          admissionNumber: admissionNum,
          firstName: admission.firstName,
          lastName: admission.lastName,
          fullName: `${admission.firstName} ${admission.lastName}`,
          dateOfBirth: admission.dateOfBirth,
          gender: admission.gender,
          bloodGroup: admission.bloodGroup || null,
          religion: admission.religion || null,
          category: admission.category || 'general',
          parentId: parent.id,
          classId: resolvedClassId,
          sectionId: resolvedSectionId,
          academicYearId: admission.academicYearId,
          aadhaarNumber: admission.aadhaarNumber || null,
          previousSchool: admission.previousSchool || null,
          status: 'active',
          addressStreet: admission.addressStreet || admission.address || null,
          addressCity: admission.addressCity || null,
          addressState: admission.addressState || null,
          addressPincode: admission.addressPincode || null,
          emergencyName: admission.emergencyContactName || admission.parentName,
          emergencyPhone: admission.emergencyContactPhone || admission.parentPhone,
          emergencyRel: admission.guardianRelationship || 'Guardian',
          medicalNote: resolvedMedicalNote,
          schoolId: schoolId || admission.schoolId
        }
      });

      // 4. Phase 2.3: Create initial enrollment history for newly converted student
      await EnrollmentService.createInitialEnrollment({
        studentId: student.id,
        schoolId: schoolId || admission.schoolId || '',
        academicYearId: admission.academicYearId,
        classId: resolvedClassId,
        sectionId: resolvedSectionId,
        rollNumber: null,
        createdById: createdBy,
      }, tx);

      // 5. Link Assigned Fees to Student
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
        data: { status: 'converted' }
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
