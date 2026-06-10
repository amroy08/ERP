import prisma from '../src/config/prisma';
import { PushNotificationService } from '../src/services/PushNotificationService';
import { firebaseConfig } from '../src/config/firebase';
import { NotificationService } from '../src/services/NotificationService';
import { registerDevice, unregisterDevice } from '../src/controllers/mobileController';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

async function main() {
  console.log('🧪 Starting Push Notifications Foundation Tests...\n');

  // Test 1: Push disabled mode does not crash and returns disabled summary
  console.log('▶️ Test 1: Testing push disabled mode...');
  // Force configuration to disabled
  const originalEnabled = firebaseConfig.isEnabled;
  const originalMessaging = firebaseConfig.messaging;
  (firebaseConfig as any).isEnabled = false;
  (firebaseConfig as any).messaging = null;

  const disabledResult = await PushNotificationService.sendToUser('some-random-user-id', {
    title: 'Test Title',
    body: 'Test Body',
  });
  console.log('   Result in disabled mode:', disabledResult);
  if (disabledResult.disabled === true && disabledResult.attempted === 0) {
    console.log('   ✅ Push disabled mode works safely and returns expected summary.');
  } else {
    throw new Error('Push disabled mode failed validation.');
  }

  // Test 2: Active vs Inactive tokens selection and mock sending
  console.log('\n▶️ Test 2: Testing token selection and invalid token deactivation with mocked Firebase...');
  
  // Find a test user or create a temporary one for testing
  let testUser = await prisma.user.findFirst({
    where: { role: 'student', isActive: true },
  });
  if (!testUser) {
    // Create mock user if none exists
    testUser = await prisma.user.create({
      data: {
        name: 'Push Test Student',
        email: `pushtest-${Date.now()}@example.com`,
        password: 'hashedpassword',
        role: 'student',
        isActive: true,
      },
    });
  }

  console.log(`   Using test user: ${testUser.email} (ID: ${testUser.id})`);

  // Clear existing tokens for this user first
  await prisma.deviceToken.deleteMany({
    where: { userId: testUser.id },
  });

  // Create two tokens: one active (to remain active), one active (to be deactivated), one inactive (to be ignored)
  const activeToken1 = `token-active-1-${Date.now()}`;
  const invalidToken = `invalid-token-${Date.now()}`;
  const inactiveToken = `token-inactive-${Date.now()}`;

  await prisma.deviceToken.createMany({
    data: [
      { token: activeToken1, userId: testUser.id, deviceType: 'ios', isActive: true },
      { token: invalidToken, userId: testUser.id, deviceType: 'android', isActive: true },
      { token: inactiveToken, userId: testUser.id, deviceType: 'web', isActive: false },
    ],
  });

  // Mock firebaseConfig as enabled
  (firebaseConfig as any).isEnabled = true;
  (firebaseConfig as any).messaging = {
    sendEach: async (messages: any[]) => {
      console.log(`      [Mock FCM] sendEach called with ${messages.length} messages.`);
      return {
        responses: messages.map(msg => {
          if (msg.token === invalidToken) {
            return {
              success: false,
              error: {
                code: 'messaging/invalid-registration-token',
                message: 'Invalid registration token mock error',
              },
            };
          }
          return { success: true };
        }),
      };
    },
  };

  // Trigger push to user
  const sendResult = await PushNotificationService.sendToUser(testUser.id, {
    title: 'Hello',
    body: 'World',
  });

  console.log('   Send result:', sendResult);
  if (sendResult.attempted !== 2) {
    throw new Error(`Expected to attempt sending to 2 active tokens, but got ${sendResult.attempted}`);
  }
  if (sendResult.successCount !== 1 || sendResult.failureCount !== 1) {
    throw new Error(`Expected 1 success and 1 failure, but got success=${sendResult.successCount}, failure=${sendResult.failureCount}`);
  }

  // Check database state after push call
  const dbTokens = await prisma.deviceToken.findMany({
    where: { userId: testUser.id },
  });

  const t1 = dbTokens.find(t => t.token === activeToken1);
  const t2 = dbTokens.find(t => t.token === invalidToken);
  const t3 = dbTokens.find(t => t.token === inactiveToken);

  if (!t1 || t1.isActive !== true) {
    throw new Error('Expected activeToken1 to remain active.');
  }
  if (!t2 || t2.isActive !== false) {
    throw new Error('Expected invalidToken to be deactivated (isActive: false).');
  }
  if (!t3 || t3.isActive !== false) {
    throw new Error('Expected inactiveToken to remain inactive.');
  }
  console.log('   ✅ Active vs Inactive token selection and invalid token deactivation PASSED.');

  // Test 3: Device Registration endpoint supports 'web'
  console.log('\n▶️ Test 3: Testing device registration/unregistration endpoint validation (allowing web)...');
  const webToken = `token-web-${Date.now()}`;
  const registerReq: any = {
    user: testUser,
    body: {
      token: webToken,
      deviceType: 'web',
      platform: 'Safari 17',
      appVersion: '1.0.0',
    },
  };
  const registerRes = createMockRes();
  await registerDevice(registerReq, registerRes, (err) => {
    if (err) console.error('   ❌ Register device failed with error:', err.message);
  });

  if (registerRes.statusCode === 200 && registerRes.jsonData?.success) {
    console.log('   ✅ Successfully registered a device token of type "web".');
  } else {
    throw new Error(`Failed to register web device. Status: ${registerRes.statusCode}, Body: ${JSON.stringify(registerRes.jsonData)}`);
  }

  // Unregister the web token
  const unregisterReq: any = {
    user: testUser,
    body: { token: webToken },
  };
  const unregisterRes = createMockRes();
  await unregisterDevice(unregisterReq, unregisterRes, (err) => {
    if (err) console.error('   ❌ Unregister device failed with error:', err.message);
  });

  if (unregisterRes.statusCode === 200 && unregisterRes.jsonData?.success && unregisterRes.jsonData?.data?.isActive === false) {
    console.log('   ✅ Successfully unregistered the "web" device token.');
  } else {
    throw new Error('Failed to unregister web device.');
  }

  // Test 4: Unregister endpoint ownership check
  console.log('\n▶️ Test 4: Testing unregister ownership security block...');
  let otherUser = await prisma.user.findFirst({
    where: { role: 'parent', isActive: true },
  });
  if (!otherUser) {
    otherUser = await prisma.user.create({
      data: {
        name: 'Push Test Parent',
        email: `pushtestparent-${Date.now()}@example.com`,
        password: 'hashedpassword',
        role: 'parent',
        isActive: true,
      },
    });
  }

  const otherToken = `other-token-${Date.now()}`;
  await prisma.deviceToken.create({
    data: { token: otherToken, userId: otherUser.id, deviceType: 'ios', isActive: true },
  });

  // Try to unregister other user's token using testUser session
  const unauthorizedReq: any = {
    user: testUser,
    body: { token: otherToken },
  };
  const unauthorizedRes = createMockRes();
  let errorCaught = false;
  await unregisterDevice(unauthorizedReq, unauthorizedRes, (err: any) => {
    if (err && err.statusCode === 403) {
      errorCaught = true;
    }
  });

  if (errorCaught || unauthorizedRes.statusCode === 403) {
    console.log('   ✅ Unregister rejected (403 Forbidden) for a token belonging to another user. Security OK.');
  } else {
    throw new Error('Security risk: User was allowed to unregister another user\'s token!');
  }

  // Clean up tokens generated for testing
  await prisma.deviceToken.deleteMany({
    where: { token: { in: [activeToken1, invalidToken, inactiveToken, webToken, otherToken] } },
  });

  // Test 5: NotificationService push calls do not break email flows
  console.log('\n▶️ Test 5: Testing NotificationService integration safety...');
  
  // Set up mock notification records
  const mockNotice = {
    id: `notice-test-${Date.now()}`,
    title: 'Emergency Maintenance Alert',
    content: 'The campus website will be offline for maintenance tonight between 10 PM and 11 PM.',
    targetRoles: 'student,parent',
    priority: 'high',
    publishDate: new Date(),
    schoolId: testUser.schoolId || null,
  };

  // We should see that this executes safely even when email is disabled or mocked, and doesn't throw.
  try {
    const notifyResult = await NotificationService.notifyNoticePublished(mockNotice);
    console.log('   NotificationService.notifyNoticePublished result:', notifyResult);
    console.log('   ✅ NotificationService push integration executed without breaking.');
  } catch (err: any) {
    throw new Error(`NotificationService notification check crashed: ${err.message}`);
  }

  // Restore firebaseConfig
  (firebaseConfig as any).isEnabled = originalEnabled;
  (firebaseConfig as any).messaging = originalMessaging;

  console.log('\n🎉 All Push Notification Foundation Tests PASSED successfully!');
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('\n❌ Test execution failed with error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
