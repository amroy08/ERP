const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const oldEmail = 'adm-2026-4526@school.com';
  const newEmail = 'stu.adm20264526@school.local';
  const newPassword = 'Student@123';
  const hashedPassword = bcrypt.hashSync(newPassword, 12);

  const user = await prisma.user.update({
    where: { email: oldEmail },
    data: { 
      email: newEmail,
      password: hashedPassword,
      isActive: true
    }
  });

  console.log('--- LOGIN FIX SUCCESSFUL ---');
  console.log('Old Email:', oldEmail);
  console.log('New Email:', user.email);
  console.log('New Password:', newPassword);
  console.log('----------------------------');
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
