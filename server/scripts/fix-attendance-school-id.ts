import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting attendance schoolId backfill...');

  // Find all attendance records where schoolId is null
  const nullAttendance = await prisma.attendance.findMany({
    where: { schoolId: null },
    include: {
      student: {
        select: { schoolId: true }
      }
    }
  });

  console.log(`🔍 Found ${nullAttendance.length} attendance records with null schoolId.`);

  let updatedCount = 0;
  for (const record of nullAttendance) {
    if (record.student && record.student.schoolId) {
      await prisma.attendance.update({
        where: { id: record.id },
        data: { schoolId: record.student.schoolId }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Successfully backfilled schoolId for ${updatedCount} attendance records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
