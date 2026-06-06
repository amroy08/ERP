/**
 * scripts/backfill-enrollment-history.ts
 *
 * Phase 2.3.1 — Enrollment History Backfill
 *
 * Scans all students in the database and creates an initial 'active'
 * StudentEnrollmentHistory record for any student that does not have one.
 * Safe to run multiple times (idempotent).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting enrollment history backfill...');

  // 1. Get all students
  const students = await prisma.student.findMany();
  console.log(`🔍 Found ${students.length} students to check.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const student of students) {
    // Check if any enrollment history already exists for this student
    const existing = await (prisma as any).studentEnrollmentHistory.findFirst({
      where: { studentId: student.id }
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    // Create the initial active enrollment history from the student's current class context
    await (prisma as any).studentEnrollmentHistory.create({
      data: {
        studentId: student.id,
        schoolId: student.schoolId,
        academicYearId: student.academicYearId,
        classId: student.classId,
        sectionId: student.sectionId,
        rollNumber: student.rollNumber || null,
        status: 'active',
        startDate: student.createdAt || new Date(),
      }
    });

    createdCount++;
  }

  console.log(`\n🎉 Backfill complete!`);
  console.log(`📊 Created: ${createdCount} history records`);
  console.log(`📊 Skipped (already had history): ${skippedCount} students`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
