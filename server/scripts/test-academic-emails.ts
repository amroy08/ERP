/**
 * scripts/test-academic-emails.ts
 *
 * Developer verification script for Phase 2.6D email triggers.
 * Verifies Notice, Homework, Exam, Date Update, and Marks triggers.
 */

import dotenv from 'dotenv';
dotenv.config();

process.env.EMAIL_ENABLED = 'true';
process.env.EMAIL_TEST_MODE = 'true';
process.env.SEEDING = 'false';

import prisma from '../src/config/prisma';
import {
  createNotice,
  createHomework,
} from '../src/controllers/moduleController';
import {
  createExam,
  updateExam,
  submitMarks,
} from '../src/controllers/examController';
import { NotificationService } from '../src/services/NotificationService';

const mockResponse = () => {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('🧪 Starting Phase 2.6D Academic Email Trigger Tests...');

  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('❌ No school found. Please seed the database first.');
    process.exit(1);
  }

  const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, schoolId: school.id } });
  if (!academicYear) {
    console.error('❌ No current academic year found.');
    process.exit(1);
  }

  const targetClass = await prisma.class.findFirst({ where: { name: 'Class 1', schoolId: school.id } });
  if (!targetClass) {
    console.error('❌ Class 1 not found.');
    process.exit(1);
  }

  const targetSection = await prisma.section.findFirst({ where: { name: 'A', classId: targetClass.id, schoolId: school.id } });
  if (!targetSection) {
    console.error('❌ Section A of Class 1 not found.');
    process.exit(1);
  }

  const targetSubject = await prisma.subject.findFirst({ where: { name: 'Mathematics', classId: targetClass.id, schoolId: school.id } });
  if (!targetSubject) {
    console.error('❌ Subject Mathematics not found.');
    process.exit(1);
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'admin', schoolId: school.id } });
  if (!adminUser) {
    console.error('❌ No admin user found.');
    process.exit(1);
  }

  const teacher = await prisma.teacher.findFirst({ where: { schoolId: school.id } });
  if (!teacher || !teacher.userId) {
    console.error('❌ No teacher found.');
    process.exit(1);
  }
  const teacherUser = await prisma.user.findUnique({ where: { id: teacher.userId } });

  // Dynamically link teacher to Class 1 Math to pass controller permission checks
  await prisma.subject.update({
    where: { id: targetSubject.id },
    data: { teacherId: teacher.id }
  });
  console.log(`🔗 Linked teacher ${teacherUser!.name} to subject ${targetSubject.name}`);

  // Clear email logs
  await (prisma as any).emailNotificationLog.deleteMany({});
  console.log('🧹 Cleared all email notification logs.');

  const mockAdminContext = {
    id: adminUser.id,
    name: adminUser.name,
    role: adminUser.role,
    schoolId: school.id,
  };

  const mockTeacherContext = {
    id: teacherUser!.id,
    name: teacherUser!.name,
    role: 'teacher',
    schoolId: school.id,
  };

  // ── Test Case 1: Create Notice ──
  console.log('\n1️⃣  Testing: Create Notice (Notice Published)...');
  const req1: any = {
    user: mockAdminContext,
    body: {
      title: 'Annual Sports Day 2026',
      content: 'The Annual Sports Day is scheduled for next Friday. Attendance is compulsory.',
      audience: ['parent', 'student'],
      priority: 'high',
      type: 'text',
    },
  };
  const res1 = mockResponse();
  await createNotice(req1, res1, (err) => { if (err) console.error(err); });

  const createdNotice = res1.body.data;
  if (!createdNotice) {
    throw new Error('Failed to create notice!');
  }
  console.log(`   Notice created: ID: ${createdNotice.id}, Title: "${createdNotice.title}"`);

  await wait(500);

  let logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'notice_published' },
  });
  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated ${logs.length} notice logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status}`);
    }
  } else {
    console.error('   ❌ Failed: No notice_published logs created.');
  }

  // ── Test Case 2: Create Homework for Class 1 Section A ──
  console.log('\n2️⃣  Testing: Create Homework (Homework Assigned)...');
  const req2: any = {
    user: mockTeacherContext,
    body: {
      title: 'Math Homework Exercise 1.2',
      description: 'Solve problems 1 to 10 on page 15 of the textbook.',
      classId: targetClass.id,
      sectionId: targetSection.id,
      subjectId: targetSubject.id,
      dueDate: '2026-06-15',
    },
  };
  const res2 = mockResponse();
  await createHomework(req2, res2, (err) => { if (err) console.error(err); });

  const createdHomework = res2.body.data;
  if (!createdHomework) {
    throw new Error('Failed to create homework!');
  }
  console.log(`   Homework created: ID: ${createdHomework.id}`);

  await wait(500);

  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'homework_assigned' },
  });
  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated ${logs.length} homework logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status} | Student: ${log.metadata?.studentId}`);
    }
  } else {
    console.error('   ❌ Failed: No homework_assigned logs created.');
  }

  // ── Test Case 3: Create Exam ──
  console.log('\n3️⃣  Testing: Create Exam (Exam Scheduled)...');
  const req3: any = {
    user: mockAdminContext,
    body: {
      name: 'Algebra Term Test',
      type: 'written',
      classId: targetClass.id,
      academicYearId: academicYear.id,
      startDate: '2026-07-05',
      endDate: '2026-07-05',
      description: 'Covers Linear Equations.',
    },
  };
  const res3 = mockResponse();
  await createExam(req3, res3, (err) => { if (err) console.error(err); });

  const createdExam = res3.body.data;
  if (!createdExam) {
    throw new Error('Failed to create exam!');
  }
  console.log(`   Exam created: ID: ${createdExam.id}, Name: "${createdExam.name}"`);

  await wait(500);

  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'exam_scheduled' },
  });
  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated ${logs.length} exam scheduled logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status}`);
    }
  } else {
    console.error('   ❌ Failed: No exam_scheduled logs created.');
  }

  // ── Test Case 4: Update Exam Date ──
  console.log('\n4️⃣  Testing: Update Exam Date...');
  const req4: any = {
    user: mockAdminContext,
    params: { id: createdExam.id },
    body: {
      startDate: '2026-07-06', // Change date
      endDate: '2026-07-06',
    },
  };
  const res4 = mockResponse();
  await updateExam(req4, res4, (err) => { if (err) console.error(err); });

  await wait(500);

  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'exam_date_changed' },
  });
  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated ${logs.length} exam date changed logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status}`);
    }
  } else {
    console.error('   ❌ Failed: No exam_date_changed logs created.');
  }

  // Update unrelated field and verify no duplicate email
  console.log('   Testing update of unrelated field (name)...');
  const req4b: any = {
    user: mockAdminContext,
    params: { id: createdExam.id },
    body: {
      name: 'Algebra Term Test - Rev 1',
    },
  };
  const res4b = mockResponse();
  await updateExam(req4b, res4b, (err) => { if (err) console.error(err); });

  await wait(500);

  const newLogsCount = await (prisma as any).emailNotificationLog.count({
    where: { eventType: 'exam_date_changed' },
  });
  if (newLogsCount === logs.length) {
    console.log('   ✅ Success: Unrelated field update did not trigger any duplicate exam_date_changed email.');
  } else {
    console.error(`   ❌ Failed: Log count increased to ${newLogsCount}. Expected ${logs.length}.`);
  }

  // ── Test Case 5: Submit Marks / Result Published ──
  console.log('\n5️⃣  Testing: Submit Marks (Result Published)...');
  const student = await prisma.student.findFirst({ where: { classId: targetClass.id, schoolId: school.id } });
  if (!student) {
    throw new Error('No student found in target class.');
  }

  const req5: any = {
    user: mockTeacherContext,
    body: {
      examId: createdExam.id,
      subjectId: targetSubject.id,
      results: [
        {
          studentId: student.id,
          marksObtained: '92',
          maxMarks: '100',
          grade: 'A+',
          remark: 'Excellent work!',
        },
      ],
    },
  };
  const res5 = mockResponse();
  await submitMarks(req5, res5, (err) => { if (err) console.error(err); });

  await wait(500);

  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'result_published' },
  });
  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated ${logs.length} result published logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status} | Metadata: ${JSON.stringify(log.metadata)}`);
    }
  } else {
    console.error('   ❌ Failed: No result_published logs created.');
  }

  // ── Test Case 6: Duplicate Prevention ──
  console.log('\n6️⃣  Testing: Duplicate Prevention...');
  // Attempt to trigger homework assigned again immediately for the same homework
  console.log('   Triggering homework assigned again for same homework...');
  await NotificationService.notifyHomeworkAssigned(createdHomework);

  await wait(500);

  const hwDuplicateLogsCount = await (prisma as any).emailNotificationLog.count({
    where: { eventType: 'homework_assigned' },
  });

  if (hwDuplicateLogsCount === 2) {
    console.log('   ✅ Success: Duplicate homework notification was suppressed (no new logs created).');
  } else {
    console.error(`   ❌ Failed: Duplicate homework notification was not suppressed. Log count is ${hwDuplicateLogsCount}, expected 2.`);
  }

  console.log('\n🎉 ALL Phase 2.6D ACADEMIC EMAIL TESTS COMPLETED!');
}

runTests().catch((err) => {
  console.error('❌ Trigger tests failed:', err);
  process.exit(1);
});
