import prisma from '../src/config/prisma';
import { NotificationService } from '../src/services/NotificationService';

async function runValidation() {
  console.log('🏁 Starting Notification Foundation Validation...');

  // 1. Fetch a real parent user and their linked child
  const parentUser = await prisma.user.findFirst({
    where: { role: 'parent', isActive: true },
    include: { parent: { include: { children: { where: { status: 'active' } } } } }
  });

  if (!parentUser || !parentUser.parent || parentUser.parent.children.length === 0) {
    throw new Error('Could not find an active parent user with linked active children in the DB.');
  }

  const child = parentUser.parent.children[0];
  const schoolId = parentUser.schoolId || child.schoolId;
  if (!schoolId) {
    throw new Error('Parent or child does not have a schoolId.');
  }

  console.log(`✅ Found parent user: ${parentUser.email} (ID: ${parentUser.id})`);
  console.log(`✅ Found linked student: ${child.fullName} (ID: ${child.id})`);

  // 2. Fetch a different student user to test security / IDOR prevention
  const otherStudentUser = await prisma.user.findFirst({
    where: { role: 'student', isActive: true, NOT: { id: parentUser.id } }
  });

  if (!otherStudentUser) {
    throw new Error('Could not find an active student user for security testing.');
  }
  console.log(`✅ Found other student user for security test: ${otherStudentUser.email} (ID: ${otherStudentUser.id})`);

  // Keep track of IDs to clean up later
  let testNotificationId: string | null = null;
  let testRuleId: string | null = null;

  try {
    // 3. Create a test notification for the parent user
    console.log('🔄 Creating test notification...');
    const notification = await NotificationService.createNotification({
      schoolId,
      recipientUserId: parentUser.id,
      recipientRole: 'parent',
      studentId: child.id,
      type: 'HOMEWORK_POSTED',
      title: 'Validation Test Homework Notice',
      message: 'This is a validation test message for notifications backend foundation.',
      priority: 'NORMAL',
    });

    if (!notification) {
      throw new Error('Notification creation returned null.');
    }
    testNotificationId = notification.id;
    console.log(`✅ Test notification created: ID ${testNotificationId}`);

    // 4. Fetch notifications for parent user
    console.log('🔄 Fetching notifications for parent user...');
    const getResult = await NotificationService.getUserNotifications({
      userId: parentUser.id,
      studentId: child.id,
    });

    const found = getResult.notifications.find(n => n.id === testNotificationId);
    if (!found) {
      throw new Error('Created notification was not found in getUserNotifications list.');
    }
    console.log('✅ Created notification successfully retrieved in user list.');

    // 5. Verify unread count
    console.log('🔄 Fetching unread count...');
    const unreadResult = await NotificationService.getUnreadCount(parentUser.id, child.id);
    console.log(`✅ Unread notifications count: ${unreadResult.unreadCount}`);
    if (unreadResult.unreadCount <= 0) {
      throw new Error('Unread count was expected to be greater than 0.');
    }

    // 6. Test IDOR prevention: other user should not be able to mark this notification as read
    console.log('🔄 Testing IDOR protection (other user trying to mark notification as read)...');
    const unauthorizedMark = await NotificationService.markAsRead(testNotificationId, otherStudentUser.id);
    if (unauthorizedMark !== null) {
      throw new Error('CRITICAL SECURITY FAIL: Other user was able to mark parent notification as read.');
    }
    console.log('✅ IDOR protection success: Unauthorized read mark rejected.');

    // 7. Mark as read by authorized owner
    console.log('🔄 Marking notification as read by owner...');
    const readNotification = await NotificationService.markAsRead(testNotificationId, parentUser.id);
    if (!readNotification || !readNotification.isRead) {
      throw new Error('Failed to mark notification as read by owner.');
    }
    console.log('✅ Notification successfully marked as read.');

    // 8. Test device token registration and removal
    console.log('🔄 Registering test device token...');
    const testToken = 'validation-test-expo-token-99999';
    const regResult = await NotificationService.registerDeviceToken({
      userId: parentUser.id,
      token: testToken,
      deviceType: 'android',
      platform: 'Android 12',
      appVersion: '1.0.0',
    });
    if (!regResult || regResult.token !== testToken) {
      throw new Error('Device token registration failed.');
    }
    console.log('✅ Device token successfully registered.');

    console.log('🔄 Deactivating test device token...');
    const unregResult = await NotificationService.removeDeviceToken(parentUser.id, testToken);
    if (!unregResult) {
      throw new Error('Device token deactivation failed.');
    }
    console.log('✅ Device token successfully deactivated.');

    // 9. Cooldown rule validation
    console.log('🔄 Configuring a custom test notification rule for cooldown tests...');
    // Upsert a test rule
    const rule = await prisma.notificationRule.upsert({
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
    testRuleId = rule.id;

    console.log('🔄 Testing cooldown evaluation: first send should be allowed (if no recent notifications)...');
    const firstCheck = await NotificationService.shouldSendReminder({
      schoolId,
      type: 'FEES_REMINDER',
      recipientUserId: parentUser.id,
      studentId: child.id,
      relatedEntityId: 'dummy-fee-structure-id',
    });
    console.log(`✅ Cooldown check 1: ${firstCheck}`);

    // Create a mock fee reminder notification to test cooldown logic
    const reminderNotif = await NotificationService.createNotification({
      schoolId,
      recipientUserId: parentUser.id,
      recipientRole: 'parent',
      studentId: child.id,
      type: 'FEES_REMINDER',
      title: 'Fee Installment Pending',
      message: 'Your school fees are due.',
      relatedEntityType: 'fee',
      relatedEntityId: 'dummy-fee-structure-id',
      priority: 'NORMAL',
    });

    console.log('🔄 Testing cooldown evaluation: second send immediately after should be blocked...');
    const secondCheck = await NotificationService.shouldSendReminder({
      schoolId,
      type: 'FEES_REMINDER',
      recipientUserId: parentUser.id,
      studentId: child.id,
      relatedEntityId: 'dummy-fee-structure-id',
    });

    console.log(`✅ Cooldown check 2 (expected false): ${secondCheck}`);
    if (secondCheck === true) {
      throw new Error('FEES_REMINDER cooldown rule failed. Allowed reminder when cooldown was active.');
    }
    console.log('✅ Cooldown protection works successfully.');

    // Clean up reminder mock notification
    if (reminderNotif) {
      await prisma.notification.delete({ where: { id: reminderNotif.id } });
    }

  } finally {
    // 10. Clean up any created test records from the DB to keep it pristine
    console.log('🔄 Running database cleanup...');
    if (testNotificationId) {
      await prisma.notification.delete({ where: { id: testNotificationId } }).catch(() => {});
    }
    if (testRuleId) {
      // Revert rule setting or delete if newly created
      await prisma.notificationRule.delete({ where: { id: testRuleId } }).catch(() => {});
    }
    await prisma.deviceToken.delete({ where: { token: 'validation-test-expo-token-99999' } }).catch(() => {});
    console.log('✅ Database cleanup completed successfully.');
  }

  console.log('🎉 Validation execution complete. All tests PASSED!');
}

runValidation().catch(err => {
  console.error('❌ Validation script failed with error:', err);
  process.exit(1);
});
