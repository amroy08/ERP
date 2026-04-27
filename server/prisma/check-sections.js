
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSections() {
  const classes = await prisma.class.findMany({
    include: { sections: true }
  });
  console.log('Classes and Sections:', JSON.stringify(classes, null, 2));
}

checkSections().finally(() => prisma.$disconnect());
