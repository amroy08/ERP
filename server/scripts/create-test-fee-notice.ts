import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Creating test Fee Structure and Notice for Phase 3.2G...');

  // 1. Find Jane Doe
  const student = await prisma.student.findFirst({
    where: { fullName: 'Jane Doe' },
    include: { class: true }
  });

  if (!student) {
    console.error('❌ Student Jane Doe not found!');
    return;
  }

  console.log(`Found student: ${student.fullName} (ID: ${student.id}, Class: ${student.class?.name})`);

  // 2. Create Fee Structure
  const fsName = 'Phase 3.2G Fee Sync Check';
  let feeStructure = await prisma.feeStructure.findFirst({
    where: { name: fsName, schoolId: student.schoolId }
  });

  if (!feeStructure) {
    feeStructure = await prisma.feeStructure.create({
      data: {
        name: fsName,
        totalAmount: 4500,
        components: [
          { name: 'Tuition', amount: 4500, category: 'tuition', frequency: 'termly' }
        ],
        classId: student.classId,
        academicYearId: student.academicYearId,
        schoolId: student.schoolId,
        isActive: true
      }
    });
    console.log(`✅ Created Fee Structure: ${feeStructure.name} (ID: ${feeStructure.id})`);
  } else {
    console.log(`ℹ️ Fee Structure already exists: ${feeStructure.name}`);
  }

  // 3. Assign Fee to Student
  const existingAssignment = await prisma.studentFee.findFirst({
    where: {
      studentId: student.id,
      feeStructureId: feeStructure.id
    }
  });

  if (!existingAssignment) {
    const studentFee = await prisma.studentFee.create({
      data: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        academicYearId: student.academicYearId,
        status: 'pending',
        schoolId: student.schoolId
      }
    });
    console.log(`✅ Assigned Fee to Student (StudentFee ID: ${studentFee.id})`);
  } else {
    console.log('ℹ️ Fee already assigned to student');
  }

  // 4. Create Notice
  const noticeTitle = 'Phase 3.2G Notice Sync Check';
  let notice = await prisma.notice.findFirst({
    where: { title: noticeTitle, schoolId: student.schoolId }
  });

  if (!notice) {
    notice = await prisma.notice.create({
      data: {
        title: noticeTitle,
        content: 'This notice verifies target role filtering and sync between web console and mobile.',
        targetRoles: 'parent,student',
        priority: 'high',
        type: 'text',
        isPublished: true,
        publishDate: new Date(),
        schoolId: student.schoolId
      }
    });
    console.log(`✅ Created Notice: ${notice.title} (ID: ${notice.id})`);
  } else {
    console.log(`ℹ️ Notice already exists: ${notice.title}`);
  }

  console.log('🎉 Done seeding test data for audit!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
