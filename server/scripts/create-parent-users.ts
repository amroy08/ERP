import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Generating User accounts for all Parents that do not have one...');
  const parents = await prisma.parent.findMany({
    where: {
      userId: null
    },
    include: {
      children: true
    }
  });

  console.log(`Found ${parents.length} parents without user accounts.`);
  
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  let createdCount = 0;

  for (const p of parents) {
    if (p.children.length === 0) {
      console.log(`Skipping Parent ${p.fatherName} (ID: ${p.id}) because they have no linked children.`);
      continue;
    }

    const primaryChild = p.children[0];
    const email = `parent.${primaryChild.admissionNumber.toLowerCase().replace(/-/g, '')}@school.local`;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`Re-linking existing user account for ${email}`);
    } else {
      const user = await prisma.user.create({
        data: {
          name: p.fatherName || p.motherName || 'Parent',
          email,
          password: hashedPassword,
          role: 'parent',
          isActive: true,
          schoolId: p.schoolId
        }
      });
      userId = user.id;
      console.log(`Created new user account for ${email}`);
    }

    await prisma.parent.update({
      where: { id: p.id },
      data: { userId }
    });

    createdCount++;
  }

  console.log(`Successfully created/linked ${createdCount} parent user accounts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
