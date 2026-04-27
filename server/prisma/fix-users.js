
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixUsers() {
  const users = await prisma.user.findMany();
  let fixedCount = 0;
  
  for (const user of users) {
    const trimmedEmail = user.email.replace(/\s+/g, '').toLowerCase();
    const updates = {};
    
    if (user.email !== trimmedEmail) {
      updates.email = trimmedEmail;
      console.log(`Fixing email for ${user.name}: "${user.email}" -> "${trimmedEmail}"`);
    }
    
    // Also reset Rohit's password if requested, or just ensure it's something standard
    if (trimmedEmail === 'tea.rohit@school.local') {
      updates.password = await bcrypt.hash('Teacher@123', 12);
      console.log(`Resetting password for Rohit to "Teacher@123"`);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates
      });
      fixedCount++;
    }
  }
  
  console.log(`Successfully fixed ${fixedCount} users.`);
}

fixUsers().finally(() => prisma.$disconnect());
