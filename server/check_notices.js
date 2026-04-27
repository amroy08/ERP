const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.notice.count();
  const notices = await prisma.notice.findMany();
  console.log('Notice Count:', count);
  console.log('Notices:', JSON.stringify(notices, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
