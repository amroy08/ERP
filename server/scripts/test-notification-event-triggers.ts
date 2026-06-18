import prisma from '../src/config/prisma';
import { NotificationService } from '../src/services/NotificationService';

async function runValidation() {
  console.log('🏁 Starting Notification Event Triggers Validation...');

  // 1. Fetch parent user and child
  const parentUser = await prisma.user.findFirst({
    where: { role: 'parent', isActive: true },
    include: { parent: { include: { children: { where: { status: 'active', user: { isActive: true } } } } } }
  });

  if (!parentUser || !parentUser.parent || parentUser.parent.children.length === 0) {
    throw new Error('Could not find an active parent user with linked active children in the DB.');
  }

  const child = parentUser.parent.children[0];
  const student = await prisma.student.findUnique({
    where: { id: child.id },
    include: { class: true, section: true, user: true, parent: { include: { user: true } } }
  });

  if (!student) {
    throw new Error('Student record not found.');
  }

  const schoolId = student.schoolId || '';
  const parentUserId = parentUser.id;
  const studentUserId = student.user?.id;

  if (!studentUserId) {
    throw new Error('Student user record has no ID.');
  }

  console.log(`✅ Using Parent: ${parentUser.email} (ID: ${parentUserId})`);
  console.log(`✅ Using Student: ${student.fullName} (ID: ${student.id})`);

  // Find a subject for this student's class
  const subject = await prisma.subject.findFirst({
    where: { classId: student.classId }
  }) || await prisma.subject.findFirst();

  if (!subject) {
    throw new Error('Could not find any subject in the DB.');
  }
  console.log(`✅ Using Subject: ${subject.name} (ID: ${subject.id})`);

  // Find other student for IDOR/role isolation test
  const otherStudentUser = await prisma.user.findFirst({
    where: { role: 'student', isActive: true, NOT: { id: studentUserId } }
  });

  if (!otherStudentUser) {
    throw new Error('Could not find a second student user for IDOR testing.');
  }

  // Find a real academic year
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId }
  });

  if (!academicYear) {
    throw new Error('Could not find academic year in DB.');
  }

  // Lists to keep track of cleanup
  const cleanupNotificationIds: string[] = [];
  const cleanupAttendanceIds: string[] = [];
  let tempFeeStructureId: string | null = null;
  let tempStudentFeeId: string | null = null;
  let tempRuleId: string | null = null;
  let tempRuleMarksId: string | null = null;
  let tempRuleFeeId: string | null = null;
  let tempExamId: string | null = null;

  try {
    // Create temporary exam in the DB so notifyResultPublished can resolve it
    console.log('\n🔄 Creating temporary exam record...');
    const tempExam = await prisma.exam.create({
      data: {
        name: 'Validation Test Exam',
        type: 'midterm',
        classId: student.classId,
        academicYearId: academicYear.id,
        startDate: new Date(),
        endDate: new Date(),
        schoolId,
      }
    });
    tempExamId = tempExam.id;
    console.log(`✅ Temporary exam created: ${tempExam.id}`);

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Homework Trigger
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🔄 Testing Homework trigger...');
    const dummyHomework = {
      id: 'test-homework-id-validation',
      schoolId,
      classId: student.classId,
      sectionId: student.sectionId,
      subjectId: subject.id,
      title: 'Validation Test Homework Title',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      description: 'Validation Test Homework Description',
    };

    await NotificationService.notifyHomeworkAssigned(dummyHomework);

    // Verify homework notification was created for student and parent
    const homeworkNotifs = await prisma.notification.findMany({
      where: {
        relatedEntityType: 'homework',
        relatedEntityId: dummyHomework.id,
      }
    });

    console.log(`📊 Found ${homeworkNotifs.length} homework notifications.`);
    cleanupNotificationIds.push(...homeworkNotifs.map(n => n.id));

    const hasStudentNotif = homeworkNotifs.some(n => n.recipientUserId === studentUserId && n.recipientRole === 'student');
    const hasParentNotif = homeworkNotifs.some(n => n.recipientUserId === parentUserId && n.recipientRole === 'parent');

    if (!hasStudentNotif || !hasParentNotif) {
      throw new Error('FAIL: Homework trigger failed to notify both student and parent.');
    }
    console.log('✅ Homework trigger successfully notified student and parent.');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Notice Trigger with Audience filter
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🔄 Testing Notice trigger audience scoping...');
    const dummyNoticeParent = {
      id: 'test-notice-parent-val',
      schoolId,
      title: 'Parent Only Notice',
      content: 'This notice is for parents only',
      targetRoles: 'parent',
      priority: 'normal',
      publishDate: new Date(),
    };

    await NotificationService.notifyNoticePublished(dummyNoticeParent);

    const noticeParentNotifs = await prisma.notification.findMany({
      where: {
        relatedEntityType: 'notice',
        relatedEntityId: dummyNoticeParent.id,
      }
    });

    cleanupNotificationIds.push(...noticeParentNotifs.map(n => n.id));

    const allAreParents = noticeParentNotifs.every(n => n.recipientRole === 'parent');
    if (!allAreParents || noticeParentNotifs.length === 0) {
      throw new Error('FAIL: Notice trigger did not respect parent audience limit.');
    }
    console.log(`✅ Notice trigger successfully restricted notifications to parents (count: ${noticeParentNotifs.length}).`);

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Exam Trigger
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🔄 Testing Exam trigger...');
    const dummyExam = {
      id: tempExam.id,
      schoolId,
      classId: student.classId,
      name: 'Validation Test exam name',
      type: 'midterm',
      startDate: new Date(),
      endDate: new Date(),
    };

    await NotificationService.notifyExamScheduled(dummyExam);

    const examNotifs = await prisma.notification.findMany({
      where: {
        relatedEntityType: 'exam',
        relatedEntityId: dummyExam.id,
      }
    });

    console.log(`📊 Found ${examNotifs.length} exam notifications.`);
    cleanupNotificationIds.push(...examNotifs.map(n => n.id));

    const hasStudentExam = examNotifs.some(n => n.recipientUserId === studentUserId);
    const hasParentExam = examNotifs.some(n => n.recipientUserId === parentUserId);

    if (!hasStudentExam || !hasParentExam) {
      throw new Error('FAIL: Exam trigger failed to notify both student and parent.');
    }
    console.log('✅ Exam trigger successfully notified student and parent.');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Marks/Result Trigger with Cooldown
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🔄 Testing Marks/Result trigger and save loop duplicate protection...');
    
    // Upsert a rule to require 24 hours cooldown for MARKS_POSTED
    const ruleMarks = await prisma.notificationRule.upsert({
      where: { schoolId_type: { schoolId, type: 'MARKS_POSTED' } },
      create: {
        schoolId,
        type: 'MARKS_POSTED',
        enabled: true,
        cooldownHours: 24,
      },
      update: {
        enabled: true,
        cooldownHours: 24,
      }
    });
    tempRuleMarksId = ruleMarks.id;

    const dummyResult = {
      id: 'test-result-id-val-1',
      studentId: student.id,
      marksObtained: 88,
      maxMarks: 100,
    };
    
    const resultsData = {
      examId: tempExam.id,
      subjectId: subject.id,
      results: [dummyResult],
      schoolId: schoolId || undefined,
    };

    // First save: should go through
    console.log('🔄 Triggering first result notification...');
    const marksRes1 = await NotificationService.notifyResultPublished(resultsData);
    if (!marksRes1.success) {
      throw new Error(`FAIL: notifyResultPublished failed: ${marksRes1.error}`);
    }

    const marksNotifs1 = await prisma.notification.findMany({
      where: {
        type: 'MARKS_POSTED',
        relatedEntityType: 'result',
        relatedEntityId: dummyResult.id,
      }
    });

    cleanupNotificationIds.push(...marksNotifs1.map(n => n.id));

    if (marksNotifs1.length === 0) {
      throw new Error('FAIL: Marks trigger failed to notify on first save.');
    }
    console.log(`✅ First marks save created ${marksNotifs1.length} notifications.`);

    // Second immediate save (simulating loop/autosave): should be blocked by cooldown
    console.log('🔄 Triggering second result notification...');
    await NotificationService.notifyResultPublished(resultsData);

    const marksNotifs2 = await prisma.notification.findMany({
      where: {
        type: 'MARKS_POSTED',
        relatedEntityType: 'result',
        relatedEntityId: dummyResult.id,
      }
    });

    console.log(`📊 Total notifications after second save: ${marksNotifs2.length}`);
    if (marksNotifs2.length > marksNotifs1.length) {
      throw new Error('FAIL: Duplicate marks notification created during cooldown window.');
    }
    console.log('✅ Cooldown successfully prevented duplicate notifications for repeated saves.');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Attendance Absence Trigger & Threshold Evaluation
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🔄 Testing Attendance absence threshold trigger...');

    // Upsert a rule to require 3 absences in 7 days for ATTENDANCE_ABSENCE_ALERT
    const rule = await prisma.notificationRule.upsert({
      where: { schoolId_type: { schoolId, type: 'ATTENDANCE_ABSENCE_ALERT' } },
      create: {
        schoolId,
        type: 'ATTENDANCE_ABSENCE_ALERT',
        enabled: true,
        thresholdCount: 3,
        thresholdDays: 7,
        cooldownHours: 24,
      },
      update: {
        enabled: true,
        thresholdCount: 3,
        thresholdDays: 7,
        cooldownHours: 24,
      }
    });
    tempRuleId = rule.id;

    // Create today's absence in DB
    const todayAbsence = await prisma.attendance.create({
      data: {
        studentId: student.id,
        date: new Date(),
        status: 'absent',
        schoolId,
      }
    });
    cleanupAttendanceIds.push(todayAbsence.id);

    // First attempt: Student has only 1 absence in DB. Threshold (3) is NOT met.
    console.log('🔄 Checking first absence notification (should be skipped, threshold not met)...');
    await NotificationService.notifyAttendanceAbsent([todayAbsence]);

    const absentNotifs1 = await prisma.notification.findMany({
      where: {
        type: 'ATTENDANCE_ABSENCE_ALERT',
        studentId: student.id,
      }
    });

    if (absentNotifs1.length > 0) {
      throw new Error('FAIL: Attendance alert sent when threshold was not met.');
    }
    console.log('✅ Threshold check passed: no notification sent for a single absence.');

    // Create 2 temporary historical absences in the last 3 days
    const hist1 = await prisma.attendance.create({
      data: {
        studentId: student.id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        status: 'absent',
        schoolId,
      }
    });
    cleanupAttendanceIds.push(hist1.id);

    const hist2 = await prisma.attendance.create({
      data: {
        studentId: student.id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'absent',
        schoolId,
      }
    });
    cleanupAttendanceIds.push(hist2.id);

    // Second attempt: Total absences = 3 (today + hist1 + hist2). Threshold met.
    console.log('🔄 Checking absence notification after threshold met (should notify)...');
    await NotificationService.notifyAttendanceAbsent([todayAbsence]);

    const absentNotifs2 = await prisma.notification.findMany({
      where: {
        type: 'ATTENDANCE_ABSENCE_ALERT',
        studentId: student.id,
      }
    });

    cleanupNotificationIds.push(...absentNotifs2.map(n => n.id));

    if (absentNotifs2.length === 0) {
      throw new Error('FAIL: Threshold met but no notification was created.');
    }
    console.log(`✅ Threshold met trigger passed: created ${absentNotifs2.length} notifications.`);

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: Fee Overdue Reminder Cooldown
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🔄 Testing Fee Reminder trigger and cooldown...');
    
    // Upsert a rule to require 24 hours cooldown for FEES_REMINDER
    const ruleFee = await prisma.notificationRule.upsert({
      where: { schoolId_type: { schoolId, type: 'FEES_REMINDER' } },
      create: {
        schoolId,
        type: 'FEES_REMINDER',
        enabled: true,
        cooldownHours: 24,
      },
      update: {
        enabled: true,
        cooldownHours: 24,
      }
    });
    tempRuleFeeId = ruleFee.id;

    // Create temporary fee structures
    const feeStructure = await prisma.feeStructure.create({
      data: {
        name: 'Validation Test Fee Structure',
        totalAmount: 5000,
        schoolId,
      }
    });
    tempFeeStructureId = feeStructure.id;

    const studentFee = await prisma.studentFee.create({
      data: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        status: 'pending',
        schoolId,
      }
    });
    tempStudentFeeId = studentFee.id;

    // Send first reminder
    console.log('🔄 Triggering first fee reminder...');
    const feeRes1 = await NotificationService.notifyFeeReminderIfAllowed(studentFee.id);
    if (!feeRes1.success || feeRes1.status !== 'sent') {
      throw new Error(`FAIL: First fee reminder failed: ${feeRes1.error || feeRes1.status}`);
    }

    const feeNotifs = await prisma.notification.findMany({
      where: {
        type: 'FEES_REMINDER',
        relatedEntityType: 'fee',
        relatedEntityId: studentFee.id,
      }
    });
    cleanupNotificationIds.push(...feeNotifs.map(n => n.id));
    console.log(`✅ First fee reminder created ${feeNotifs.length} notifications.`);

    // Send second reminder immediately (should be blocked by cooldown)
    console.log('🔄 Triggering second fee reminder (cooldown active)...');
    const feeRes2 = await NotificationService.notifyFeeReminderIfAllowed(studentFee.id);
    if (feeRes2.status !== 'skipped') {
      throw new Error('FAIL: Fee reminder cooldown failed to block repeated reminder.');
    }
    console.log('✅ Cooldown successfully blocked duplicate fee reminder.');

    // Update status to paid and check reminder (should block since paid)
    console.log('🔄 Updating student fee status to paid...');
    await prisma.studentFee.update({
      where: { id: studentFee.id },
      data: { status: 'paid' }
    });

    const feeRes3 = await NotificationService.notifyFeeReminderIfAllowed(studentFee.id);
    if (feeRes3.error !== 'Fee is already fully paid') {
      throw new Error('FAIL: Fee reminder allowed notification for a fully paid fee.');
    }
    console.log('✅ Fee status verification passed: Paid fee skipped reminders.');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: IDOR Scoping and Role Isolation
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n🔄 Testing Role Isolation and IDOR prevention...');
    // Fetch notifications for the other student
    const otherNotifs = await NotificationService.getUserNotifications({
      userId: otherStudentUser.id
    });

    // Make sure they cannot see student's private notifications
    const containsLeaked = otherNotifs.notifications.some(n => cleanupNotificationIds.includes(n.id));
    if (containsLeaked) {
      throw new Error('CRITICAL IDOR FAIL: Student seen private notifications of other users.');
    }
    console.log('✅ IDOR check passed: Scoped user notifications are completely isolated.');

  } finally {
    console.log('\n🧹 Starting database cleanup...');
    // Delete created notifications
    if (cleanupNotificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: cleanupNotificationIds } }
      }).catch(() => {});
    }

    // Delete created attendance records
    if (cleanupAttendanceIds.length > 0) {
      await prisma.attendance.deleteMany({
        where: { id: { in: cleanupAttendanceIds } }
      }).catch(() => {});
    }

    // Delete temporary fee structures
    if (tempStudentFeeId) {
      await prisma.studentFee.delete({
        where: { id: tempStudentFeeId }
      }).catch(() => {});
    }
    if (tempFeeStructureId) {
      await prisma.feeStructure.delete({
        where: { id: tempFeeStructureId }
      }).catch(() => {});
    }

    // Delete temporary exam
    if (tempExamId) {
      await prisma.exam.delete({
        where: { id: tempExamId }
      }).catch(() => {});
    }

    // Delete temporary rules
    if (tempRuleId) {
      await prisma.notificationRule.delete({
        where: { id: tempRuleId }
      }).catch(() => {});
    }
    if (tempRuleMarksId) {
      await prisma.notificationRule.delete({
        where: { id: tempRuleMarksId }
      }).catch(() => {});
    }
    if (tempRuleFeeId) {
      await prisma.notificationRule.delete({
        where: { id: tempRuleFeeId }
      }).catch(() => {});
    }

    console.log('✅ Database cleanup completed successfully.');
  }

  console.log('\n🎉 Validation execution complete. All tests PASSED!');
}

runValidation().catch(err => {
  console.error('❌ Validation script failed with error:', err);
  process.exit(1);
});
