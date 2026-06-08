/**
 * scripts/test-triggers.ts
 *
 * End-to-end trigger verification script for Phase 2.6C.
 * Mocks request/response cycles to trigger controller handlers and
 * asserts that the correct EmailNotificationLog records are generated.
 */

import dotenv from 'dotenv';
dotenv.config();

// Force Email sending in test mode
process.env.EMAIL_ENABLED = 'true';
process.env.EMAIL_TEST_MODE = 'true';
// Ensure we are NOT in seeding mode
process.env.SEEDING = 'false';

import prisma from '../src/config/prisma';
import {
  createAdmission,
  updateAdmission,
  convertAdmissionToStudent,
  createTeacher,
  createStaff,
  resetTeacherPassword,
  resetStaffPassword,
} from '../src/controllers/moduleController';
import { resetStudentPassword } from '../src/controllers/studentController';

// Helper to construct a mock Express Response object
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

// Helper to sleep/wait for async/fire-and-forget logs to write to the DB
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('🧪 Starting Phase 2.6C Trigger Verification Tests...');
  
  // 1. Fetch default school & academic year
  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('❌ No school found. Please seed the database first using: npm run seed');
    process.exit(1);
  }
  const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, schoolId: school.id } });
  if (!academicYear) {
    console.error('❌ No active academic year found.');
    process.exit(1);
  }
  const targetClass = await prisma.class.findFirst({ where: { schoolId: school.id } });
  const targetSection = await prisma.section.findFirst({ where: { schoolId: school.id } });

  const adminUser = await prisma.user.findFirst({ where: { role: 'admin', schoolId: school.id } });
  if (!adminUser) {
    console.error('❌ No admin user found.');
    process.exit(1);
  }

  // Clear existing email logs to start clean
  await (prisma as any).emailNotificationLog.deleteMany({});
  console.log('🧹 Cleared all email notification logs.');

  // Mock user session context
  const mockUserContext = {
    id: adminUser.id,
    name: adminUser.name,
    role: adminUser.role,
    schoolId: school.id,
  };

  // ── Test Case 1: Create Admission (Application Submitted) ──
  console.log('\n1️⃣  Testing: Create Admission (Application Submitted)...');
  const req1: any = {
    user: mockUserContext,
    body: {
      firstName: 'Tom',
      lastName: 'Hanks',
      parentName: 'Rita Hanks',
      parentEmail: 'parent.tom@example.com',
      parentPhone: '9876543219',
      dateOfBirth: '2016-07-09',
      gender: 'male',
      classId: targetClass?.id,
      sectionId: targetSection?.id,
      address: 'Hollywood Ave 10',
    },
  };
  const res1 = mockResponse();
  await createAdmission(req1, res1, (err) => { if (err) console.error(err); });

  const createdAdmission = res1.body.data;
  if (!createdAdmission) {
    throw new Error('Failed to create admission record!');
  }
  console.log(`   Created Admission ID: ${createdAdmission.id}, App No: ${createdAdmission.applicationNo}`);

  // Wait for fire-and-forget notification to log
  await wait(500);

  let logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'admission_application_submitted' },
  });
  if (logs.length === 1 && logs[0].status === 'test' && logs[0].recipientEmail === 'parent.tom@example.com') {
    console.log('   ✅ Success: Received admission_application_submitted log with status "test"');
  } else {
    console.error('   ❌ Failed: Unexpected log count or details:', logs);
  }

  // ── Test Case 2: Approve Admission ──
  console.log('\n2️⃣  Testing: Approve Admission...');
  const req2: any = {
    user: mockUserContext,
    params: { id: createdAdmission.id },
    body: {
      status: 'approved',
    },
  };
  const res2 = mockResponse();
  await updateAdmission(req2, res2, (err) => { if (err) console.error(err); });

  await wait(500);
  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'admission_approved' },
  });
  if (logs.length === 1 && logs[0].status === 'test' && logs[0].recipientEmail === 'parent.tom@example.com') {
    console.log('   ✅ Success: Received admission_approved log with status "test"');
  } else {
    console.error('   ❌ Failed: Unexpected approved log:', logs);
  }

  // ── Test Case 3: Update Admission without status change (Duplicate check) ──
  console.log('\n3️⃣  Testing: Update unrelated field on approved admission...');
  const req3: any = {
    user: mockUserContext,
    params: { id: createdAdmission.id },
    body: {
      status: 'approved',
      parentPhone: '9999999999', // Change phone number
    },
  };
  const res3 = mockResponse();
  await updateAdmission(req3, res3, (err) => { if (err) console.error(err); });

  await wait(500);
  const approvedLogsCount = await (prisma as any).emailNotificationLog.count({
    where: { eventType: 'admission_approved', recipientEmail: 'parent.tom@example.com' },
  });
  if (approvedLogsCount === 1) {
    console.log('   ✅ Success: No duplicate admission_approved log created.');
  } else {
    console.error(`   ❌ Failed: Log count is ${approvedLogsCount}, expected 1.`);
  }

  // ── Test Case 4: Reject a different Admission ──
  console.log('\n4️⃣  Testing: Reject a new Admission...');
  const req4a: any = {
    user: mockUserContext,
    body: {
      firstName: 'Rejected',
      lastName: 'Student',
      parentName: 'Parent of Rejected',
      parentEmail: 'parent.rejected@example.com',
      parentPhone: '9876543210',
      dateOfBirth: '2016-07-09',
      gender: 'female',
      classId: targetClass?.id,
      sectionId: targetSection?.id,
      address: 'Street 99',
    },
  };
  const res4a = mockResponse();
  await createAdmission(req4a, res4a, (err) => { if (err) console.error(err); });
  const rejAdmission = res4a.body.data;

  const req4b: any = {
    user: mockUserContext,
    params: { id: rejAdmission.id },
    body: {
      status: 'rejected',
      remarks: 'Incorrect DOB submitted.',
    },
  };
  const res4b = mockResponse();
  await updateAdmission(req4b, res4b, (err) => { if (err) console.error(err); });

  await wait(500);
  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'admission_rejected' },
  });
  if (logs.length === 1 && logs[0].status === 'test' && logs[0].recipientEmail === 'parent.rejected@example.com') {
    console.log('   ✅ Success: Received admission_rejected log with remarks:', logs[0].errorMessage || 'None');
  } else {
    console.error('   ❌ Failed: Unexpected rejected log:', logs);
  }

  // ── Test Case 5: Convert approved admission to student ──
  console.log('\n5️⃣  Testing: Convert admission to student...');
  const req5: any = {
    user: mockUserContext,
    params: { id: createdAdmission.id },
    body: {
      classId: targetClass?.id,
      sectionId: targetSection?.id,
    },
  };
  const res5 = mockResponse();
  await convertAdmissionToStudent(req5, res5, (err) => { if (err) console.error(err); });

  await wait(500);
  const parentEnrolledLog = await (prisma as any).emailNotificationLog.findFirst({
    where: { eventType: 'student_enrolled', recipientRole: 'parent' },
  });
  const studentEnrolledLog = await (prisma as any).emailNotificationLog.findFirst({
    where: { eventType: 'student_enrolled', recipientRole: 'student' },
  });

  if (parentEnrolledLog && parentEnrolledLog.status === 'test') {
    console.log('   ✅ Success: Parent received student_enrolled log with status "test".');
  } else {
    console.error('   ❌ Failed: Parent enrollment log missing or incorrect:', parentEnrolledLog);
  }

  if (studentEnrolledLog && studentEnrolledLog.status === 'skipped') {
    console.log('   ✅ Success: Student enrollment log is "skipped" (due to synthetic email).');
  } else {
    console.error('   ❌ Failed: Student enrollment log missing or incorrect (should be skipped):', studentEnrolledLog);
  }

  // ── Test Case 6: Create Teacher with real email ──
  console.log('\n6️⃣  Testing: Create Teacher with real email...');
  const teacherEmail = `alice.teacher.${Date.now()}@example.com`;
  const req6: any = {
    user: mockUserContext,
    body: {
      firstName: 'Alice',
      lastName: 'Smith',
      email: teacherEmail,
      phone: '9876543222',
      qualification: 'B.Ed',
      joiningDate: '2026-06-01',
      designation: 'Math Teacher',
      status: 'active',
    },
  };
  const res6 = mockResponse();
  await createTeacher(req6, res6, (err) => { if (err) console.error(err); });
  const createdTeacher = res6.body.teacher;

  await wait(500);
  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'welcome_user', recipientRole: 'teacher', recipientEmail: teacherEmail },
  });
  if (logs.length === 1 && logs[0].status === 'test' && logs[0].recipientEmail === teacherEmail) {
    console.log('   ✅ Success: Welcome teacher log created with status "test".');
  } else {
    console.error('   ❌ Failed: Welcome teacher log missing or incorrect:', logs);
  }

  // ── Test Case 7: Create Staff with real email ──
  console.log('\n7️⃣  Testing: Create Staff with real email...');
  const staffEmail = `bob.staff.${Date.now()}@example.com`;
  const req7: any = {
    user: mockUserContext,
    body: {
      firstName: 'Bob',
      lastName: 'Jones',
      email: staffEmail,
      phone: '9876543223',
      department: 'Accounting',
      role: 'Staff Accountant',
      joiningDate: '2026-06-01',
      status: 'active',
    },
  };
  const res7 = mockResponse();
  await createStaff(req7, res7, (err) => { if (err) console.error(err); });
  const createdStaff = res7.body.data;

  await wait(500);
  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'welcome_user', recipientRole: 'staff', recipientEmail: staffEmail },
  });
  if (logs.length === 1 && logs[0].status === 'test' && logs[0].recipientEmail === staffEmail) {
    console.log('   ✅ Success: Welcome staff log created with status "test".');
  } else {
    console.error('   ❌ Failed: Welcome staff log missing or incorrect:', logs);
  }

  // ── Test Case 8: Reset Student Password ──
  console.log('\n8️⃣  Testing: Reset Student Password...');
  const targetStudent = await prisma.student.findFirst({
    where: { schoolId: school.id },
  });
  if (!targetStudent) {
    throw new Error('No student found for reset test.');
  }

  const req8: any = {
    user: mockUserContext,
    params: { id: targetStudent.id },
  };
  const res8 = mockResponse();
  await resetStudentPassword(req8, res8, (err) => { if (err) console.error(err); });

  await wait(500);
  const studentResetLog = await (prisma as any).emailNotificationLog.findFirst({
    where: { eventType: 'password_reset', recipientRole: 'student' },
  });
  if (studentResetLog && studentResetLog.status === 'skipped') {
    console.log('   ✅ Success: Password reset log is skipped due to synthetic student email.');
  } else {
    console.error('   ❌ Failed: Unexpected password reset log:', studentResetLog);
  }

  // ── Test Case 9: Reset Teacher Password ──
  console.log('\n9️⃣  Testing: Reset Teacher Password...');
  const req9: any = {
    user: mockUserContext,
    params: { id: createdTeacher.id },
  };
  const res9 = mockResponse();
  await resetTeacherPassword(req9, res9, (err) => { if (err) console.error(err); });

  await wait(500);
  const teacherResetLog = await (prisma as any).emailNotificationLog.findFirst({
    where: { eventType: 'password_reset', recipientRole: 'teacher' },
  });
  if (teacherResetLog && teacherResetLog.status === 'skipped') {
    console.log('   ✅ Success: Password reset log is skipped due to synthetic teacher email.');
  } else {
    console.error('   ❌ Failed: Unexpected password reset log:', teacherResetLog);
  }

  // ── Test Case 10: Reset Staff Password ──
  console.log('\n🔟  Testing: Reset Staff Password...');
  const req10: any = {
    user: mockUserContext,
    params: { id: createdStaff.id },
  };
  const res10 = mockResponse();
  await resetStaffPassword(req10, res10, (err) => { if (err) console.error(err); });

  await wait(500);
  const staffResetLog = await (prisma as any).emailNotificationLog.findFirst({
    where: { eventType: 'password_reset', recipientRole: 'staff', recipientEmail: staffEmail },
  });
  if (staffResetLog && staffResetLog.status === 'test') {
    console.log(`   ✅ Success: Password reset log is "test" due to real staff email ${staffEmail}.`);
  } else {
    console.error('   ❌ Failed: Unexpected password reset log:', staffResetLog);
  }

  console.log('\n🎉 ALL Phase 2.6C TRIGGER VERIFICATION TESTS EXECUTED!');
}

runTests().catch((err) => {
  console.error('❌ Trigger tests failed:', err);
  process.exit(1);
});
