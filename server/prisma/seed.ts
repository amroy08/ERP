import { PrismaClient, Role, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.bookIssue.deleteMany();
  await prisma.book.deleteMany();
  await prisma.admissionFee.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.result.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.section.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  console.log('🗑️  Cleared existing data');

  // 1. Create Default School
  const school = await prisma.school.create({
    data: {
      name: 'Vantage International School',
      address: '123 Academic Way, Education City',
      phone: '+91 98765 43210',
      email: 'info@vantage.edu',
      principal: 'Dr. Sarah Mitchell',
      tagline: 'Empowering Future Leaders',
      slug: 'vantage-international',
      enabledModules: [
        'attendance', 'homework', 'exams', 'timetable', 
        'fees', 'notices', 'library', 'inventory', 'transport', 'admissions'
      ]
    }
  });

  // 2. Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2025-26',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: true,
      schoolId: school.id
    },
  });

  // 3. Classes and Sections
  const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  let firstClassId = '';
  
  for (const name of classNames) {
    const cls = await prisma.class.create({
      data: {
        name,
        numericValue: parseInt(name.split(' ')[1]),
        schoolId: school.id,
        sections: {
          create: [
            { name: 'A', schoolId: school.id }, 
            { name: 'B', schoolId: school.id }
          ]
        }
      }
    });

    if (name === 'Class 1') firstClassId = cls.id;

    // Create a subject for each class
    await prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: `MATH-${cls.numericValue}-${school.id.substring(0, 4)}`,
        classId: cls.id,
        schoolId: school.id
      }
    });
  }

  // 4. Sample Fee Structures for Class 1
  if (firstClassId) {
    await prisma.feeStructure.createMany({
      data: [
        { name: 'Tuition Fee', totalAmount: 15000, classId: firstClassId, schoolId: school.id, isActive: true },
        { name: 'Term 1 Fee', totalAmount: 5000, classId: firstClassId, schoolId: school.id, isActive: true },
        { name: 'Books & Stationary', totalAmount: 3500, classId: firstClassId, schoolId: school.id, isActive: true },
      ]
    });
  }

  // 5. Users
  const hashedPass = await bcrypt.hash('Admin@123', 10);
  
  // Super Admin (No schoolId - platform wide)
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@school.com',
      password: hashedPass,
      role: Role.super_admin,
      schoolId: null
    },
  });

  // School Clerk (Linked to school)
  await prisma.user.create({
    data: {
      name: 'Sample Clerk',
      email: 'clerk@school.com',
      password: hashedPass,
      role: Role.clerk,
      schoolId: school.id
    },
  });

  // 6. Sample Items for Inventory
  await prisma.inventoryItem.create({
    data: {
      name: 'Chalk Box',
      category: 'Stationary',
      quantity: 50,
      minStock: 10,
      schoolId: school.id
    }
  });

  // 7. Sample Books for Library
  await prisma.book.create({
    data: {
      title: 'Digital Fortress',
      author: 'Dan Brown',
      isbn: '978-0312944926',
      category: 'Fiction',
      available: 5,
      quantity: 5,
      schoolId: school.id
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log('Super Admin: admin@school.com / Admin@123');
  console.log('Clerk: clerk@school.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });