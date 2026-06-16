import prisma from '../src/config/prisma';

async function main() {
  console.log('Fetching recent activity logs...');
  const logs = await prisma.activityLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  
  if (logs.length === 0) {
    console.log('No activity logs found.');
  } else {
    logs.forEach(log => {
      console.log(`[${log.createdAt.toISOString()}] Performed By: ${log.performedBy || 'N/A'} - StudentID: ${log.studentId || 'N/A'} - Action: ${log.action} - Description: ${log.description || 'N/A'}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
