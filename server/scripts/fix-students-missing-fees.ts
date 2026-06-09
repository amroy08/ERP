import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting student missing fees assignment script...');

  // Find all active students with 0 assigned fees
  const studentsWithNoFees = await prisma.student.findMany({
    where: {
      status: 'active',
      assignedFees: { none: {} }
    },
    include: {
      class: true
    }
  });

  console.log(`🔍 Found ${studentsWithNoFees.length} students with no fee structures assigned.`);

  let totalAssigned = 0;
  for (const student of studentsWithNoFees) {
    if (!student.classId) continue;

    // Find class-wide active fee structures for this class & academic year
    const classFees = await prisma.feeStructure.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ classId: student.classId }, { classId: null }] },
          { OR: [{ academicYearId: student.academicYearId }, { academicYearId: null }] }
        ],
        schoolId: student.schoolId
      }
    });

    if (classFees.length > 0) {
      console.log(`👉 Assigning ${classFees.length} fees to ${student.fullName} (Class: ${student.class?.name || 'Unknown'})`);
      
      const data = classFees.map(cf => ({
        studentId: student.id,
        feeStructureId: cf.id,
        customAmount: null,
        academicYearId: student.academicYearId,
        schoolId: student.schoolId
      }));

      await prisma.studentFee.createMany({ data });
      totalAssigned += classFees.length;
    }
  }

  console.log(`✅ Successfully assigned ${totalAssigned} fee structures across affected students.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
