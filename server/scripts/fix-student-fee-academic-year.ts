import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting student fee academicYearId backfill...');

  // Find all studentFee records where academicYearId is null
  const nullStudentFees = await prisma.studentFee.findMany({
    where: { academicYearId: null },
    include: {
      student: {
        select: { academicYearId: true }
      }
    }
  });

  console.log(`🔍 Found ${nullStudentFees.length} studentFee records with null academicYearId.`);

  let updatedCount = 0;
  for (const record of nullStudentFees) {
    if (record.student && record.student.academicYearId) {
      await prisma.studentFee.update({
        where: { id: record.id },
        data: { academicYearId: record.student.academicYearId }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Successfully backfilled academicYearId for ${updatedCount} studentFee records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
