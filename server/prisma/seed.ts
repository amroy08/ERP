import { PrismaClient, Role, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed check...');

  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV || 'development';

  console.log(`🔍 Node Environment: ${nodeEnv}`);
  console.log(`🔍 Target Database URL: ${dbUrl.replace(/:([^:@]+)@/, ':****@')}`); // Mask password in logs

  // 1. Production Environment Guard
  if (nodeEnv.toLowerCase() === 'production') {
    console.error('❌ CRITICAL ERROR: Database seeding is BLOCKED in production environments to prevent data loss.');
    process.exit(1);
  }

  // 2. Production/Staging database URL checks (non-local or production keywords)
  const isLocalHost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') || dbUrl.includes('::1');
  const containsProdKeywords = dbUrl.toLowerCase().includes('prod') || dbUrl.toLowerCase().includes('production') || dbUrl.toLowerCase().includes('live');

  if (!isLocalHost || containsProdKeywords) {
    if (process.env.ALLOW_DB_SEED_RESET !== 'true') {
      console.error('❌ SAFETY GUARD TRIGGERED: Database URL appears to target a remote or production database.');
      console.error('To proceed with destructive reset, you must explicitly set the environment variable: ALLOW_DB_SEED_RESET=true');
      process.exit(1);
    } else {
      console.log('⚠️  ALLOW_DB_SEED_RESET=true is set. Bypassing database URL location safety check.');
    }
  }

  console.log('⚠️  WARNING: Destructive reset starting. All tables will be cleared.');

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.admissionFee.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.result.deleteMany();
  await prisma.exam.deleteMany();
  await (prisma as any).studentEnrollmentHistory.deleteMany();  // Phase 2.3
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

  console.log('🗑️  Cleared existing data successfully.');

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
        'fees', 'notices', 'transport', 'admissions'
      ],
      licensedRoles: ['teacher', 'staff', 'parent', 'student']
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
  const createdClasses: any[] = [];
  
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
      },
      include: {
        sections: true
      }
    });
    createdClasses.push(cls);

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

  const class1 = createdClasses.find(c => c.name === 'Class 1');
  const section1A = class1.sections.find((s: any) => s.name === 'A');

  // 4. Sample Fee Structures for Class 1
  await prisma.feeStructure.createMany({
    data: [
      { name: 'Tuition Fee', totalAmount: 15000, classId: class1.id, schoolId: school.id, isActive: true },
      { name: 'Term 1 Fee', totalAmount: 5000, classId: class1.id, schoolId: school.id, isActive: true },
      { name: 'Books & Stationary', totalAmount: 3500, classId: class1.id, schoolId: school.id, isActive: true },
    ]
  });

  const dbFeeStructures = await prisma.feeStructure.findMany({
    where: { classId: class1.id }
  });

  // 5. User Passwords
  const hashedPass = await bcrypt.hash('Admin@123', 10);

  // Super Admin (Global context, schoolId null)
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'super_admin@school.com',
      password: hashedPass,
      role: Role.super_admin,
      schoolId: null
    },
  });

  // Admin (Linked to school)
  await prisma.user.create({
    data: {
      name: 'School Admin',
      email: 'admin@school.com',
      password: hashedPass,
      role: Role.admin,
      schoolId: school.id
    },
  });

  // Principal (Linked to school)
  await prisma.user.create({
    data: {
      name: 'School Principal',
      email: 'principal@school.com',
      password: hashedPass,
      role: Role.principal,
      schoolId: school.id
    },
  });

  // Clerk / Staff User & Record (Linked to school)
  const clerkUser = await prisma.user.create({
    data: {
      name: 'School Clerk',
      email: 'clerk@school.com',
      password: hashedPass,
      role: Role.clerk,
      schoolId: school.id
    },
  });

  await prisma.staff.create({
    data: {
      userId: clerkUser.id,
      employeeId: 'EMP-CLK-001',
      department: 'Administration',
      designation: 'School Clerk',
      joiningDate: new Date(),
      status: 'active',
      schoolId: school.id
    }
  });

  // Teacher User & Record (Linked to school)
  const teacherUser = await prisma.user.create({
    data: {
      name: 'Class Teacher',
      email: 'teacher@school.com',
      password: hashedPass,
      role: Role.teacher,
      schoolId: school.id
    },
  });

  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeId: 'EMP-TCH-001',
      designation: 'Class Teacher',
      qualification: 'M.Sc, B.Ed',
      experience: 5,
      joiningDate: new Date(),
      status: 'active',
      schoolId: school.id
    }
  });

  // Parent User & Record (Linked to school)
  const parentUser = await prisma.user.create({
    data: {
      name: 'Jane Doe Father',
      email: 'parent@school.com',
      password: hashedPass,
      role: Role.parent,
      schoolId: school.id
    },
  });

  const parent = await prisma.parent.create({
    data: {
      userId: parentUser.id,
      fatherName: 'John Doe',
      fatherPhone: '9876543210',
      motherName: 'Mary Doe',
      motherPhone: '9876543211',
      address: '456 Family Lane, Resident Area',
      schoolId: school.id
    }
  });

  // Student User & Record (Linked to school, parent, class, section)
  const studentUser = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'student@school.com',
      password: hashedPass,
      role: Role.student,
      schoolId: school.id
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      parentId: parent.id,
      admissionNumber: 'ADM-2025-0001',
      rollNumber: '01',
      firstName: 'Jane',
      lastName: 'Doe',
      fullName: 'Jane Doe',
      dateOfBirth: new Date('2015-05-15'),
      gender: Gender.female,
      classId: class1.id,
      sectionId: section1A.id,
      academicYearId: academicYear.id,
      status: 'active',
      schoolId: school.id
    }
  });

  // Assign Student Fees (Pre-population)
  if (dbFeeStructures.length > 0) {
    await prisma.studentFee.createMany({
      data: dbFeeStructures.map(fs => ({
        studentId: student.id,
        feeStructureId: fs.id,
        academicYearId: academicYear.id,
        status: 'pending',
        schoolId: school.id
      }))
    });
  }

  // Phase 2.3: Create initial enrollment history for seeded student
  await (prisma as any).studentEnrollmentHistory.create({
    data: {
      studentId: student.id,
      schoolId: school.id,
      academicYearId: academicYear.id,
      classId: class1.id,
      sectionId: section1A.id,
      rollNumber: '01',
      status: 'active',
      startDate: new Date(),
    }
  });
  console.log('📚 Initial enrollment history created for seeded student.');

  // 6. notices sample data for portal visibility
  await prisma.notice.create({
    data: {
      title: 'Welcome to Vantage ERP',
      content: 'We are excited to launch Vantage ERP for school resource planning.',
      targetRoles: 'all',
      priority: 'high',
      type: 'text',
      publishDate: new Date(),
      isPublished: true,
      createdBy: clerkUser.id,
      schoolId: school.id
    }
  });

  // 7. Attendance sample data
  await prisma.attendance.create({
    data: {
      date: new Date('2026-06-06T00:00:00Z'),
      status: 'present',
      studentId: student.id,
      schoolId: school.id
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('🔑 TEST USER CREDENTIALS (Password for all: Admin@123)');
  console.log('--------------------------------------------------');
  console.log('👑 Super Admin : super_admin@school.com');
  console.log('🏢 Admin       : admin@school.com');
  console.log('🎓 Principal   : principal@school.com');
  console.log('📝 Teacher     : teacher@school.com');
  console.log('💼 Clerk       : clerk@school.com');
  console.log('👪 Parent      : parent@school.com');
  console.log('👶 Student     : student@school.com');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });