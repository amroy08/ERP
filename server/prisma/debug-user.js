const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'stu.adm20264526@school.local';
  const newPassword = 'Student@123';
  const hashedPassword = bcrypt.hashSync(newPassword, 12);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { 
      password: hashedPassword,
      isActive: true
    }
  });

  console.log('--- DEBUG INFO ---');
  console.log('User Found & Updated:', updatedUser.email);
  console.log('Account Active:', updatedUser.isActive);
  console.log('Password Reset To:', newPassword);
  console.log('------------------');
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
