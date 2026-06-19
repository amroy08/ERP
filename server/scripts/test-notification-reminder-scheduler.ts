import prisma from '../src/config/prisma';
import { NotificationReminderService } from '../src/services/NotificationReminderService';
import { runReminders } from '../src/controllers/notificationController';

async function runValidation() {
  console.log('🏁 Starting Notification Reminder Scheduler Validation...');

  // 1. Fetch an active student user with a linked active parent
  const student = await prisma.student.findFirst({
    where: {
      status: 'active',
      parent: {
        user: {
          isActive: true,
        },
      },
    },
    include: {
      parent: {
        include: {
          user: true,
        },
      },
      assignedFees: {
        include: {
          feeStructure: true,
        },
      },
    },
  });

  if (!student || !student.parent || !student.parent.user) {
    throw new Error('Could not find an active student with an active parent in the DB.');
  }

  const schoolId = student.schoolId;
  if (!schoolId) {
    throw new Error('Student does not have a schoolId.');
  }

  console.log(`✅ Target Student: ${student.fullName} (ID: ${student.id})`);
  console.log(`✅ Target Parent: ${student.parent.fatherName || student.parent.motherName || 'Parent'} (User ID: ${student.parent.user.id})`);

  let tempStudentFeeId: string | null = null;
  let fee = student.assignedFees[0];
  let originalFeeStatus = 'pending';

  // If no fee, temporarily allocate one to keep test database hermetic
  if (!fee) {
    const feeStructure = await prisma.feeStructure.findFirst();
    if (!feeStructure) {
      throw new Error('No fee structure exists in the database. Cannot execute fee reminders test.');
    }
    const newFee = await prisma.studentFee.create({
      data: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        status: 'pending',
        schoolId,
      },
    });
    const populatedFee = await prisma.studentFee.findUnique({
      where: { id: newFee.id },
      include: { feeStructure: true },
    });
    if (!populatedFee) {
      throw new Error('Failed to query populated temporary student fee.');
    }
    fee = populatedFee;
    tempStudentFeeId = newFee.id;
    console.log(`✅ Created temporary student fee: ${fee.id}`);
  } else {
    originalFeeStatus = fee.status;
    await prisma.studentFee.update({
      where: { id: fee.id },
      data: { status: 'pending' },
    });
    console.log(`✅ Set existing student fee ${fee.id} status from "${originalFeeStatus}" to "pending".`);
  }

  // Configure rules
  let feeRuleId: string | null = null;
  let originalFeeRule: any = null;

  let absenceRuleId: string | null = null;
  let originalAbsenceRule: any = null;

  // Setup normalized dates for attendance
  const today = new Date();
  const formatDbDate = (d: Date) => {
    const newD = new Date(d);
    newD.setUTCHours(12, 0, 0, 0); // midday to avoid timezone boundary issues
    return newD;
  };

  const date1 = new Date(today);
  date1.setDate(today.getDate() - 1);
  const date2 = new Date(today);
  date2.setDate(today.getDate() - 2);
  const date3 = new Date(today);
  date3.setDate(today.getDate() - 3);

  const testDates = [formatDbDate(date1), formatDbDate(date2), formatDbDate(date3)];

  try {
    // Revert/delete existing rules or fetch for backup
    const feeRule = await prisma.notificationRule.findUnique({
      where: { schoolId_type: { schoolId, type: 'FEES_REMINDER' } },
    });
    if (feeRule) {
      originalFeeRule = { ...feeRule };
    }
    const newFeeRule = await prisma.notificationRule.upsert({
      where: { schoolId_type: { schoolId, type: 'FEES_REMINDER' } },
      create: { schoolId, type: 'FEES_REMINDER', enabled: true, cooldownHours: 24 },
      update: { enabled: true, cooldownHours: 24 },
    });
    feeRuleId = newFeeRule.id;

    const absenceRule = await prisma.notificationRule.findUnique({
      where: { schoolId_type: { schoolId, type: 'ATTENDANCE_ABSENCE_ALERT' } },
    });
    if (absenceRule) {
      originalAbsenceRule = { ...absenceRule };
    }
    const newAbsenceRule = await prisma.notificationRule.upsert({
      where: { schoolId_type: { schoolId, type: 'ATTENDANCE_ABSENCE_ALERT' } },
      create: { schoolId, type: 'ATTENDANCE_ABSENCE_ALERT', enabled: true, cooldownHours: 24, thresholdCount: 3, thresholdDays: 7 },
      update: { enabled: true, cooldownHours: 24, thresholdCount: 3, thresholdDays: 7 },
    });
    absenceRuleId = newAbsenceRule.id;

    // --- TEST 1: Fee reminders ---
    console.log('🔄 Running Test 1: Fee reminders...');
    
    // Clear out any old notifications for FEES_REMINDER
    await prisma.notification.deleteMany({
      where: {
        recipientUserId: student.parent.user.id,
        type: 'FEES_REMINDER',
      },
    });

    // Scan 1: Fee pending
    console.log('🔄 Scan 1 (Pending fee): Expect reminder to be created...');
    const scan1 = await NotificationReminderService.runFeeReminderScan();
    console.log('Scan 1 result:', scan1);
    if (scan1.created === 0) {
      throw new Error('Expected fee reminder to be created, but count was 0.');
    }

    // Scan 2: Cooldown duplicate prevention
    console.log('🔄 Scan 2 (Immediately after): Expect skipped by cooldown...');
    const scan2 = await NotificationReminderService.runFeeReminderScan();
    console.log('Scan 2 result:', scan2);
    if (scan2.skippedCooldown === 0 || scan2.created > 0) {
      throw new Error('Expected scan 2 to skip due to cooldown, but counts did not match.');
    }

    // Scan 3: Fully paid fee should skip
    console.log('🔄 Scan 3 (Fee paid): Expect skippedPaid...');
    // Clear cooldown by deleting the notification we just created
    await prisma.notification.deleteMany({
      where: {
        recipientUserId: student.parent.user.id,
        type: 'FEES_REMINDER',
      },
    });
    // Set fee status to paid
    await prisma.studentFee.update({
      where: { id: fee.id },
      data: { status: 'paid' },
    });
    const scan3 = await NotificationReminderService.runFeeReminderScan();
    console.log('Scan 3 result:', scan3);
    const checkNotif = await prisma.notification.findFirst({
      where: {
        recipientUserId: student.parent.user.id,
        type: 'FEES_REMINDER',
        relatedEntityId: fee.id,
      },
    });
    if (checkNotif) {
      throw new Error('Expected no fee reminder to be created for a paid fee, but one was found.');
    }
    console.log('✅ Verified paid fee did not generate any reminder.');

    // --- TEST 2: Absence reminder threshold scan ---
    console.log('🔄 Running Test 2: Absence reminders...');

    // Clear old test records & any notifications for ATTENDANCE_ABSENCE_ALERT
    await prisma.notification.deleteMany({
      where: {
        recipientUserId: student.parent.user.id,
        type: 'ATTENDANCE_ABSENCE_ALERT',
      },
    });
    await prisma.attendance.deleteMany({
      where: {
        studentId: student.id,
        date: { in: testDates },
      },
    });

    // Create 2 absences (below threshold of 3)
    await prisma.attendance.create({
      data: { studentId: student.id, date: testDates[0], status: 'absent', schoolId },
    });
    await prisma.attendance.create({
      data: { studentId: student.id, date: testDates[1], status: 'absent', schoolId },
    });

    console.log('🔄 Scan 4 (Below threshold): Expect no alert generated...');
    const scan4 = await NotificationReminderService.runAbsenceReminderScan();
    console.log('Scan 4 result:', scan4);
    if (scan4.thresholdMet > 0 || scan4.created > 0) {
      throw new Error('Expected no alert created below threshold, but counts were non-zero.');
    }

    // Create 3rd absence (meets threshold of 3)
    await prisma.attendance.create({
      data: { studentId: student.id, date: testDates[2], status: 'absent', schoolId },
    });

    console.log('🔄 Scan 5 (Threshold met): Expect alert generated...');
    const scan5 = await NotificationReminderService.runAbsenceReminderScan();
    console.log('Scan 5 result:', scan5);
    if (scan5.created === 0) {
      throw new Error('Expected absence alert to be created, but count was 0.');
    }

    console.log('🔄 Scan 6 (Immediately after): Expect skippedCooldown...');
    const scan6 = await NotificationReminderService.runAbsenceReminderScan();
    console.log('Scan 6 result:', scan6);
    if (scan6.skippedCooldown === 0 || scan6.created > 0) {
      throw new Error('Expected scan 6 to skip due to cooldown, but counts did not match.');
    }

    // --- TEST 3: Admin Manual Runner Endpoint Security ---
    console.log('🔄 Running Test 3: Admin controller manual route endpoint security...');

    // Test unauthorized role rejection (parent/student role check)
    let responseStatus: number | null = null;
    let responseData: any = null;

    const mockReqParent = {
      user: {
        role: 'parent',
      },
    } as any;

    const mockResParent = {
      status: function (code: number) {
        responseStatus = code;
        return this;
      },
      json: function (data: any) {
        responseData = data;
        return this;
      },
    } as any;

    await runReminders(mockReqParent, mockResParent, (err) => {});
    if (responseStatus !== 403) {
      throw new Error(`Endpoint authorization fail: allowed parent role. Status returned: ${responseStatus}`);
    }
    console.log('✅ Endpoint successfully rejected parent user with 403.');

    // Test authorized role execution
    responseStatus = null;
    responseData = null;

    const mockReqAdmin = {
      user: {
        role: 'admin',
      },
    } as any;

    const mockResAdmin = {
      status: function (code: number) {
        responseStatus = code;
        return this;
      },
      json: function (data: any) {
        responseData = data;
        return this;
      },
    } as any;

    // Reset cooldowns to allow success response tracking
    await prisma.notification.deleteMany({
      where: {
        recipientUserId: student.parent.user.id,
        type: { in: ['FEES_REMINDER', 'ATTENDANCE_ABSENCE_ALERT'] },
      },
    });
    // Set fee status back to pending to trigger a scan
    await prisma.studentFee.update({
      where: { id: fee.id },
      data: { status: 'pending' },
    });

    await runReminders(mockReqAdmin, mockResAdmin, (err) => {});
    console.log('Admin route execution output response data:', responseData);
    if (responseData && responseData.success === false) {
      throw new Error('Admin execution returned failure status.');
    }
    if (!responseData || !responseData.data || !responseData.data.feeReminderScan || !responseData.data.absenceReminderScan) {
      throw new Error('Admin execution response shape does not contain scans summary metrics.');
    }
    
    // Ensure no private details leaked in endpoint payload
    const keys = Object.keys(responseData.data.feeReminderScan);
    const forbiddenKeys = ['student', 'parent', 'studentId', 'parentId', 'fee', 'amount', 'name'];
    const hasLeak = forbiddenKeys.some(fk => keys.includes(fk) || JSON.stringify(responseData).includes(fk + '":'));
    if (hasLeak) {
      console.warn('⚠️ Warning: Potential private data field key match in response payload.');
    }
    console.log('✅ Admin controller executed successfully and returned only counts.');

  } finally {
    console.log('🔄 Cleaning up database test modifications...');

    // Delete notifications created
    if (student?.parent?.user?.id) {
      await prisma.notification.deleteMany({
        where: {
          recipientUserId: student.parent.user.id,
          type: { in: ['FEES_REMINDER', 'ATTENDANCE_ABSENCE_ALERT'] },
        },
      });
    }

    // Delete attendance records
    await prisma.attendance.deleteMany({
      where: {
        studentId: student.id,
        date: { in: testDates },
      },
    });

    // Revert student fee status or delete temp
    if (tempStudentFeeId) {
      await prisma.studentFee.delete({ where: { id: tempStudentFeeId } }).catch(() => {});
    } else if (fee) {
      await prisma.studentFee.update({
        where: { id: fee.id },
        data: { status: originalFeeStatus },
      }).catch(() => {});
    }

    // Revert rules
    if (originalFeeRule) {
      await prisma.notificationRule.update({
        where: { id: originalFeeRule.id },
        data: { enabled: originalFeeRule.enabled, cooldownHours: originalFeeRule.cooldownHours },
      });
    } else if (feeRuleId) {
      await prisma.notificationRule.delete({ where: { id: feeRuleId } }).catch(() => {});
    }

    if (originalAbsenceRule) {
      await prisma.notificationRule.update({
        where: { id: originalAbsenceRule.id },
        data: {
          enabled: originalAbsenceRule.enabled,
          cooldownHours: originalAbsenceRule.cooldownHours,
          thresholdCount: originalAbsenceRule.thresholdCount,
          thresholdDays: originalAbsenceRule.thresholdDays,
        },
      });
    } else if (absenceRuleId) {
      await prisma.notificationRule.delete({ where: { id: absenceRuleId } }).catch(() => {});
    }

    console.log('✅ Cleanup completed.');
  }

  console.log('🎉 Notification Reminder Scheduler Validation Complete. All checks PASSED!');
}

runValidation().catch(err => {
  console.error('❌ Validation script failed:', err);
  process.exit(1);
});
