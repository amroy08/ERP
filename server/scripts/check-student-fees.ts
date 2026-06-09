import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admissionNumber = 'ADM-2026-2533';
  console.log(`🔍 Checking student: ${admissionNumber}`);

  const student = await prisma.student.findFirst({
    where: { admissionNumber },
    include: {
      assignedFees: {
        include: {
          feeStructure: true
        }
      },
      class: true
    }
  });

  if (!student) {
    console.log('❌ Student not found!');
    return;
  }

  console.log('Student Info:');
  console.log(`- ID: ${student.id}`);
  console.log(`- Name: ${student.fullName}`);
  console.log(`- Class ID: ${student.classId} (${student.class?.name})`);
  console.log(`- Academic Year ID: ${student.academicYearId}`);
  console.log(`- Fees count: ${student.assignedFees.length}`);

  student.assignedFees.forEach((f: any, idx: number) => {
    console.log(`Fee ${idx + 1}:`);
    console.log(`  - StudentFee ID: ${f.id}`);
    console.log(`  - Structure ID: ${f.feeStructureId} (${f.feeStructure?.name})`);
    console.log(`  - Academic Year ID: ${f.academicYearId}`);
    console.log(`  - School ID: ${f.schoolId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
