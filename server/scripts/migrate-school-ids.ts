/**
 * Migration: Link all existing data to the default school
 * Run once: ts-node scripts/migrate-school-ids.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting school ID migration...');

  // 1. Get or create the default school
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Default School',
        address: 'Default Address',
        phone: '0000000000',
        email: 'admin@school.com',
        enabledModules: ['attendance','homework','exams','timetable','fees','notices','library','inventory','transport','admissions'],
        licensedRoles: ['admin','staff','teacher','student','parent'],
        licensePlan: 'enterprise',
        slug: 'default-school',
      }
    });
    console.log('✅ Created default school:', school.id);
  } else {
    // Set slug if not set
    if (!school.slug) {
      school = await prisma.school.update({
        where: { id: school.id },
        data: { 
          slug: 'default-school',
          licensedRoles: (school.licensedRoles as any) || ['admin','staff','teacher','student','parent'],
          licensePlan: school.licensePlan || 'enterprise',
        }
      });
    }
    console.log('✅ Using existing school:', school.id, school.name);
  }

  const schoolId = school.id;

  // 2. Link all non-super_admin users to this school
  const userUpdate = await prisma.user.updateMany({
    where: { 
      role: { not: 'super_admin' },
      schoolId: null
    },
    data: { schoolId }
  });
  console.log(`✅ Updated ${userUpdate.count} users with schoolId`);

  // 3. Link all classes to this school
  const classUpdate = await prisma.class.updateMany({
    where: { schoolId: null },
    data: { schoolId }
  });
  console.log(`✅ Updated ${classUpdate.count} classes with schoolId`);

  // 4. Link all academic years to this school
  const yearUpdate = await prisma.academicYear.updateMany({
    where: { schoolId: null },
    data: { schoolId }
  });
  console.log(`✅ Updated ${yearUpdate.count} academic years with schoolId`);

  console.log('\n🎉 Migration complete! All existing data is now linked to school:', school.name);
  console.log('   School ID:', schoolId);
  console.log('   Super admins remain unscoped (schoolId = null = sees all schools)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
