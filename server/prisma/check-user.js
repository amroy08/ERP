
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'rohit' } }
  });
  console.log('User found:', user);
  const allUsers = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log('All users:', allUsers);
}

checkUser().finally(() => prisma.$disconnect());
