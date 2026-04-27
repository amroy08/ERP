
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNames() {
  const users = await prisma.user.findMany();
  let fixedCount = 0;
  
  for (const user of users) {
    const fixedName = user.name.replace(/\s+/g, ' ').trim();
    if (user.name !== fixedName) {
      console.log(`Fixing name for ${user.email}: "${user.name}" -> "${fixedName}"`);
      await prisma.user.update({
        where: { id: user.id },
        data: { name: fixedName }
      });
      fixedCount++;
    }
  }
  
  console.log(`Successfully fixed names for ${fixedCount} users.`);
}

fixNames().finally(() => prisma.$disconnect());
