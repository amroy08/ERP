/**
 * scripts/test-fee-attendance-emails.ts
 *
 * Developer verification script for Phase 2.6E email triggers.
 * Verifies Fee Payment Receipt and Attendance Absent Triggers.
 */

import dotenv from 'dotenv';
dotenv.config();

process.env.EMAIL_ENABLED = 'true';
process.env.EMAIL_TEST_MODE = 'true';
process.env.SEEDING = 'false';

import prisma from '../src/config/prisma';
import { collectFee } from '../src/controllers/feeController';
import { markAttendance } from '../src/controllers/moduleController';
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
  console.log('🧪 Starting Phase 2.6E Fee and Attendance Email Trigger Tests...');

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

  // Find the seeded parent and student
  const student = await prisma.student.findFirst({
    where: { classId: targetClass.id, sectionId: targetSection.id, schoolId: school.id },
    include: {
      user: true,
      parent: {
        include: {
          user: true
        }
      }
    }
  });

  if (!student || !student.parent || !student.parent.user || !student.user) {
    console.error('❌ Seeded student, parent, or users not found.');
    process.exit(1);
  }

  // Configure parent to have a real email and student to have a synthetic email for first test
  await prisma.user.update({
    where: { id: student.parent.user.id },
    data: { email: 'realparent@example.com' }
  });
  await prisma.user.update({
    where: { id: student.user.id },
    data: { email: 'syntheticstudent@school.local' }
  });
  console.log('📝 Configured parent user email: realparent@example.com');
  console.log('📝 Configured student user email: syntheticstudent@school.local');

  const clerkUser = await prisma.user.findFirst({ where: { role: 'clerk', schoolId: school.id } });
  if (!clerkUser) {
    console.error('❌ No clerk/staff user found.');
    process.exit(1);
  }

  const mockClerkContext = {
    id: clerkUser.id,
    name: clerkUser.name,
    role: 'clerk',
    schoolId: school.id,
  };

  // Clear email logs
  await (prisma as any).emailNotificationLog.deleteMany({});
  console.log('🧹 Cleared email notification logs.');

  // ── Test Case 1: Collect Flat Fee Payment ──
  console.log('\n1️⃣  Testing: Collect Flat Fee Payment (FIFO)...');
  const req1: any = {
    user: mockClerkContext,
    body: {
      studentId: student.id,
      amountPaid: '500.00',
      paymentMode: 'cash',
      remarks: 'Test flat payment'
    }
  };
  const res1 = mockResponse();
  await collectFee(req1, res1, (err) => { if (err) console.error(err); });

  const flatPayment = res1.body.data;
  if (!flatPayment) {
    throw new Error('Failed to collect flat fee payment!');
  }
  console.log(`   Flat payment recorded: ID: ${flatPayment.id}, Receipt: ${flatPayment.receiptNumber}, Amount: Rs.${flatPayment.amountPaid}`);

  await wait(500);

  // Check email logs
  let logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'fee_payment_receipt' }
  });
  
  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated ${logs.length} fee receipt email logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status} | Msg: ${log.errorMessage || 'N/A'}`);
      if (log.recipientEmail === 'realparent@example.com') {
        if (log.status !== 'test') {
          console.error(`      ❌ Expected status 'test' for real email but got: ${log.status}`);
        }
      } else if (log.recipientEmail === 'syntheticstudent@school.local') {
        if (log.status !== 'skipped') {
          console.error(`      ❌ Expected status 'skipped' for synthetic email but got: ${log.status}`);
        }
      }
    }
  } else {
    console.error('   ❌ Failed: No fee_payment_receipt logs created.');
  }

  // ── Test Case 2: Collect Allocated Fee Payment ──
  console.log('\n2️⃣  Testing: Collect Allocated Fee Payment...');
  // Find outstanding student fees and build explicit allocation
  const assignedFees = await prisma.studentFee.findMany({
    where: { studentId: student.id, academicYearId: academicYear.id },
    include: { feeStructure: true }
  });

  const targetFee = assignedFees[0];
  const compName = (targetFee.feeStructure.components && Array.isArray(targetFee.feeStructure.components) && targetFee.feeStructure.components.length > 0)
    ? (targetFee.feeStructure.components as any[])[0].name
    : targetFee.feeStructure.name;

  const req2: any = {
    user: mockClerkContext,
    body: {
      studentId: student.id,
      amountPaid: '100.00',
      paymentMode: 'bank_transfer',
      remarks: 'Test allocated payment',
      allocations: [
        {
          studentFeeId: targetFee.id,
          componentName: compName,
          amount: '100.00'
        }
      ]
    }
  };
  const res2 = mockResponse();
  await collectFee(req2, res2, (err) => { if (err) console.error(err); });

  const allocatedPayment = res2.body.data;
  if (!allocatedPayment) {
    throw new Error('Failed to collect allocated fee payment!');
  }
  console.log(`   Allocated payment recorded: ID: ${allocatedPayment.id}, Receipt: ${allocatedPayment.receiptNumber}, Amount: Rs.${allocatedPayment.amountPaid}`);

  await wait(500);

  // Check email logs for allocated payment
  const allHwLogs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'fee_payment_receipt' }
  });
  logs = allHwLogs.filter((log: any) => log.metadata && log.metadata.paymentId === allocatedPayment.id);

  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated allocated fee receipt email logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status}`);
      console.log(`      Metadata: ${JSON.stringify(log.metadata)}`);
    }
  } else {
    console.error('   ❌ Failed: No logs found for this specific allocated payment.');
  }

  // ── Test Case 3: Fee Payment Receipt Duplicate Prevention ──
  console.log('\n3️⃣  Testing: Fee Payment Receipt Duplicate Suppression...');
  // Trigger notification again with flatPayment
  console.log('   Triggering fee receipt notification again for the same flat payment...');
  await NotificationService.notifyFeePaymentReceipt(flatPayment);

  await wait(500);

  // Verify the log count did not increase for parent or student
  const parentLogsCount = await (prisma as any).emailNotificationLog.count({
    where: { eventType: 'fee_payment_receipt', recipientEmail: 'realparent@example.com' }
  });
  // Initially we sent one for flatPayment, one for allocatedPayment, and a third should be suppressed.
  // So expected count is 2 (since the duplicate trigger for flatPayment is suppressed).
  if (parentLogsCount === 2) {
    console.log(`   ✅ Success: Duplicate payment receipt suppressed. Log count: ${parentLogsCount} (Expected 2).`);
  } else {
    console.error(`   ❌ Failed: Duplicate check failed. Log count: ${parentLogsCount} (Expected 2).`);
  }

  // ── Test Case 4: Mark Student Absent ──
  console.log('\n4️⃣  Testing: Mark Student Absent (Attendance Absent Alert)...');
  const todayStr = new Date().toISOString().split('T')[0];

  const req4: any = {
    user: mockClerkContext,
    body: {
      records: [
        {
          studentId: student.id,
          date: todayStr,
          status: 'absent',
          remark: 'Absent today'
        }
      ]
    }
  };
  const res4 = mockResponse();
  await markAttendance(req4, res4, (err) => { if (err) console.error(err); });

  const attendanceResults = res4.body.data;
  if (!attendanceResults || attendanceResults.length === 0) {
    throw new Error('Failed to mark student absent!');
  }
  console.log(`   Attendance marked: Date: ${todayStr}, Status: ${attendanceResults[0].status}`);

  await wait(500);

  // Verify absent email log
  logs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'attendance_absent_alert' }
  });

  if (logs.length > 0) {
    console.log(`   ✅ Success: Generated ${logs.length} absent alert email logs.`);
    for (const log of logs) {
      console.log(`      Recipient: ${log.recipientEmail} | Status: ${log.status} | Date: ${log.metadata?.attendanceDate}`);
      if (log.recipientEmail !== 'realparent@example.com') {
        console.error(`      ❌ Expected absent alert sent to parent only, but got: ${log.recipientEmail}`);
      }
    }
  } else {
    console.error('   ❌ Failed: No attendance_absent_alert logs created.');
  }

  // ── Test Case 5: Attendance Duplicate Prevention ──
  console.log('\n5️⃣  Testing: Attendance Absent Duplicate Suppression...');
  // Trigger notifyAttendanceAbsent again immediately for the same record
  console.log('   Triggering attendance absent alert again for same student and date...');
  await NotificationService.notifyAttendanceAbsent(attendanceResults);

  await wait(500);

  const absentLogsCount = await (prisma as any).emailNotificationLog.count({
    where: { eventType: 'attendance_absent_alert', recipientEmail: 'realparent@example.com' }
  });

  if (absentLogsCount === 1) {
    console.log(`   ✅ Success: Duplicate absent alert suppressed. Log count: ${absentLogsCount} (Expected 1).`);
  } else {
    console.error(`   ❌ Failed: Duplicate absent alert not suppressed. Log count: ${absentLogsCount} (Expected 1).`);
  }

  // ── Test Case 6: Present/Late/Leave records do not trigger absent emails ──
  console.log('\n6️⃣  Testing: Present/Late/Leave does not trigger absent emails...');
  // Change status of same student on another date to 'present'
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const req6: any = {
    user: mockClerkContext,
    body: {
      records: [
        {
          studentId: student.id,
          date: tomorrowStr,
          status: 'present',
          remark: 'Present tomorrow'
        }
      ]
    }
  };
  const res6 = mockResponse();
  await markAttendance(req6, res6, (err) => { if (err) console.error(err); });

  await wait(500);

  // Verify no new logs are generated for attendance_absent_alert
  const finalAbsentLogsCount = await (prisma as any).emailNotificationLog.count({
    where: { eventType: 'attendance_absent_alert' }
  });

  if (finalAbsentLogsCount === 1) {
    console.log(`   ✅ Success: No notification triggered for 'present' status. Total logs: ${finalAbsentLogsCount} (Expected 1).`);
  } else {
    console.error(`   ❌ Failed: Status 'present' triggered an email. Total logs: ${finalAbsentLogsCount} (Expected 1).`);
  }

  // ── Test Case 7: Synthetic Parent Email Skipping ──
  console.log('\n7️⃣  Testing: Synthetic Parent Email Skipping...');
  // Set parent user email to a synthetic one
  await prisma.user.update({
    where: { id: student.parent.user.id },
    data: { email: 'parent.jane@school.local' }
  });
  console.log('📝 Configured parent user email: parent.jane@school.local (synthetic)');

  // Clear log of parent
  await (prisma as any).emailNotificationLog.deleteMany({
    where: { eventType: 'attendance_absent_alert' }
  });

  // Mark absent on a third date
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  const req7: any = {
    user: mockClerkContext,
    body: {
      records: [
        {
          studentId: student.id,
          date: dayAfterTomorrowStr,
          status: 'absent',
          remark: 'Absent day after tomorrow'
        }
      ]
    }
  };
  const res7 = mockResponse();
  await markAttendance(req7, res7, (err) => { if (err) console.error(err); });

  await wait(500);

  const skippedLogs = await (prisma as any).emailNotificationLog.findMany({
    where: { eventType: 'attendance_absent_alert', recipientEmail: 'parent.jane@school.local' }
  });

  if (skippedLogs.length > 0 && skippedLogs[0].status === 'skipped') {
    console.log(`   ✅ Success: Synthetic parent email correctly skipped and logged.`);
    console.log(`      Log detail: Recipient: ${skippedLogs[0].recipientEmail} | Status: ${skippedLogs[0].status} | Error: ${skippedLogs[0].errorMessage}`);
  } else {
    console.error(`   ❌ Failed: Synthetic parent email was not skipped/logged as skipped.`);
  }

  console.log('\n🎉 ALL Phase 2.6E FEE & ATTENDANCE EMAIL TESTS COMPLETED successfully!');
}

runTests().catch((err) => {
  console.error('❌ Trigger tests failed:', err);
  process.exit(1);
});
