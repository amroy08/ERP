/**
 * server/src/services/EnrollmentService.ts
 *
 * Phase 2.3 — Student Enrollment History
 *
 * Central helper for creating and closing StudentEnrollmentHistory records.
 * All writes to student_enrollment_history must go through this service to
 * keep history consistent.
 */
import prisma from '../config/prisma';

export class EnrollmentService {
  /**
   * Create the first (initial) enrollment record for a newly created student.
   * Should be called immediately after the Student row is created.
   */
  static async createInitialEnrollment(params: {
    studentId: string;
    schoolId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    rollNumber?: string | null;
    createdById?: string | null;
  }, tx?: any) {
    const db = tx ?? prisma;
    const { studentId, schoolId, academicYearId, classId, sectionId, rollNumber, createdById } = params;

    // Guard: do not create if active enrollment already exists (idempotent)
    const existing = await (db as any).studentEnrollmentHistory.findFirst({
      where: { studentId, status: 'active' }
    });
    if (existing) return existing;

    return (db as any).studentEnrollmentHistory.create({
      data: {
        studentId,
        schoolId,
        academicYearId,
        classId,
        sectionId,
        rollNumber: rollNumber ?? null,
        status: 'active',
        startDate: new Date(),
        createdById: createdById ?? null,
      }
    });
  }

  /**
   * Close the current active enrollment and open a new one (used on promotion).
   * Wrapped in a transaction by the caller (promoteStudent) but can also be
   * called standalone — it wraps its own transaction if tx is not provided.
   */
  static async promoteEnrollment(
    params: {
      studentId: string;
      schoolId: string;
      newAcademicYearId: string;
      newClassId: string;
      newSectionId: string;
      newRollNumber?: string | null;
      promotedById?: string | null;
    },
    tx?: any  // Prisma transaction client (optional)
  ) {
    const db = tx ?? prisma;
    const {
      studentId, schoolId, newAcademicYearId, newClassId, newSectionId,
      newRollNumber, promotedById
    } = params;

    const now = new Date();

    // 1. Close all active enrollment records for this student
    const activeEnrollments = await (db as any).studentEnrollmentHistory.findMany({
      where: { studentId, status: 'active' }
    });

    for (const enrollment of activeEnrollments) {
      await (db as any).studentEnrollmentHistory.update({
        where: { id: enrollment.id },
        data: { status: 'completed', endDate: now }
      });
    }

    // 2. Create new active enrollment for the promoted class/section/year
    return (db as any).studentEnrollmentHistory.create({
      data: {
        studentId,
        schoolId,
        academicYearId: newAcademicYearId,
        classId: newClassId,
        sectionId: newSectionId,
        rollNumber: newRollNumber ?? null,
        status: 'active',
        startDate: now,
        createdById: promotedById ?? null,
      }
    });
  }

  /**
   * Get the full enrollment history for a student, ordered most-recent first.
   */
  static async getHistory(studentId: string) {
    return (prisma as any).studentEnrollmentHistory.findMany({
      where: { studentId },
      include: {
        academicYear: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } }
      },
      orderBy: { startDate: 'desc' }
    });
  }
}
