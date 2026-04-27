const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    include: { user: true }
  });

  console.log('--- STARTING GLOBAL LOGIN FIX ---');
  
  const defaultPassword = 'Student@123';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 12);

  for (const student of students) {
    if (student.user) {
      const oldEmail = student.user.email;
      // Format: stu.[admissionNumWithoutDashes]@school.local
      const newEmail = `stu.${student.admissionNumber.toLowerCase().replace(/-/g, '')}@school.local`;
      
      await prisma.user.update({
        where: { id: student.userId },
        data: { 
          email: newEmail,
          password: hashedPassword,
          isActive: true
        }
      });
      
      console.log(`Updated: ${oldEmail} -> ${newEmail}`);
    }
  }

  console.log('--- GLOBAL LOGIN FIX COMPLETED ---');
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
