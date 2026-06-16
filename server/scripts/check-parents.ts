import prisma from '../src/config/prisma';

async function main() {
  console.log('Fetching parents that have a user account linked...');
  const parents = await prisma.parent.findMany({
    where: {
      userId: { not: null }
    },
    include: {
      user: true,
      children: true,
    },
  });

  console.log(`Found ${parents.length} parents with user accounts:`);
  parents.forEach(p => {
    console.log(`- Parent Name: ${p.fatherName} / ${p.motherName}`);
    console.log(`  Email: ${p.user?.email}`);
    console.log(`  Children: ${p.children.map(c => c.fullName).join(', ')}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
