/**
 * scripts/test-email.ts
 *
 * Diagnostic script to verify the email notification foundation.
 * Run with: npm run test-email <recipient-email>
 */

import dotenv from 'dotenv';
// Load environment variables before importing anything else
dotenv.config();

import { NotificationService } from '../src/services/NotificationService';
import { getEmailConfigSummary } from '../src/config/email';
import prisma from '../src/config/prisma';

async function main() {
  const args = process.argv.slice(2);
  const recipient = args[0] || 'test@example.com';

  console.log('🔄 Starting Email Notification System Verification...');
  console.log('📊 Current Environment Configuration:');
  console.log(`   ${getEmailConfigSummary()}`);

  console.log(`\n📧 Sending test email to: "${recipient}"...`);
  
  const result = await NotificationService.sendTestEmail({
    to: recipient,
    recipientName: 'Verification Recipient',
    schoolName: 'Verification Academy',
  });

  console.log('\n🏁 Execution Results:');
  console.log(`   Success: ${result.success}`);
  console.log(`   Status:  ${result.status}`);
  if (result.logId) {
    console.log(`   Log ID:  ${result.logId}`);
    
    // Retrieve the log from the database to verify db insertion works
    const log = await prisma.emailNotificationLog.findUnique({
      where: { id: result.logId },
    });
    if (log) {
      console.log('   ✅ Successfully retrieved log from database:');
      console.log(`      - Event Type: ${log.eventType}`);
      console.log(`      - Recipient:  ${log.recipientEmail}`);
      console.log(`      - Status:     ${log.status}`);
      console.log(`      - Error:      ${log.errorMessage || 'None'}`);
      console.log(`      - Sent At:    ${log.sentAt ? log.sentAt.toISOString() : 'N/A'}`);
    } else {
      console.log('   ❌ Created log ID but could not retrieve it from the database!');
    }
  } else {
    console.log(`   Log:     No log created.`);
  }

  if (result.error) {
    console.log(`   Error:   ${result.error}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Diagnostic script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
