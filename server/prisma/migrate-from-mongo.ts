/**
 * 💡 SCHOOL ERP - MONGO TO MYSQL MIGRATION SCRIPT
 * 
 * This script provides a template to migrate your existing MongoDB data to MySQL.
 * 
 * SETUP:
 * 1. Install mongodb: `npm install mongodb`
 * 2. Ensure your .env has MONGO_URI and DATABASE_URL (MySQL)
 * 3. Run with: `npx ts-node prisma/migrate-from-mongo.ts`
 */

import { MongoClient, ObjectId } from 'mongodb';
import { PrismaClient, Role, Gender } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/school_erp');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting Data Migration: MongoDB -> MySQL...');
  
  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db();
    
    // 1. Migrate Academic Years
    console.log('📅 Migrating Academic Years...');
    const mongoAYs = await mongoDb.collection('academicyears').find().toArray();
    for (const ay of mongoAYs) {
      await prisma.academicYear.upsert({
        where: { name: ay.name },
        update: {},
        create: {
          id: ay._id.toString(),
          name: ay.name,
          startDate: ay.startDate,
          endDate: ay.endDate,
          isCurrent: ay.isCurrent || false
        }
      });
    }

    // 2. Migrate Classes
    console.log('🏛️  Migrating Classes...');
    const mongoClasses = await mongoDb.collection('classes').find().toArray();
    for (const c of mongoClasses) {
      await prisma.class.upsert({
        where: { name: c.name },
        update: {},
        create: {
          id: c._id.toString(),
          name: c.name,
          numericValue: c.numericValue || 0,
        }
      });
    }

    // 3. Migrate Users (Crucial for Auth)
    console.log('👤 Migrating Users...');
    const mongoUsers = await mongoDb.collection('users').find().toArray();
    for (const u of mongoUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          password: u.password, // Passwords remain hashed from Mongo
          role: u.role.toLowerCase() as Role,
          phone: u.phone,
          isActive: u.isActive ?? true
        }
      });
    }

    // 4. Migrate Students
    console.log('🎓 Migrating Students...');
    const mongoStudents = await mongoDb.collection('students').find().toArray();
    for (const s of mongoStudents) {
      try {
        await prisma.student.create({
          data: {
            id: s._id.toString(),
            admissionNumber: s.admissionNumber,
            firstName: s.firstName,
            lastName: s.lastName,
            fullName: `${s.firstName} ${s.lastName}`,
            dateOfBirth: s.dateOfBirth,
            gender: s.gender.toLowerCase() as Gender,
            status: s.status || 'active',
            classId: s.class.toString(),
            sectionId: s.section ? s.section.toString() : '',
            academicYearId: s.academicYear ? s.academicYear.toString() : (await prisma.academicYear.findFirst())?.id || '',
            parentId: s.parent ? s.parent.toString() : '',
            userId: s.user ? s.user.toString() : null,
          }
        });
      } catch (e) {
        console.warn(`⚠️  Failed to migrate student ${s.admissionNumber}:`, e.message);
      }
    }

    // 5. Migrate Library Books
    console.log('📚 Migrating Library Books...');
    const mongoBooks = await mongoDb.collection('books').find().toArray();
    for (const b of mongoBooks) {
      await prisma.book.upsert({
        where: { isbn: b.isbn },
        update: {},
        create: {
          id: b._id.toString(),
          title: b.title,
          author: b.author,
          isbn: b.isbn,
          category: b.category,
          quantity: b.quantity || 1,
          available: b.availableCopies || b.quantity || 1,
          status: b.status || 'available',
        }
      });
    }

    // 6. Migrate Inventory
    console.log('📦 Migrating Inventory Items...');
    const mongoInventory = await mongoDb.collection('inventoryitems').find().toArray();
    for (const i of mongoInventory) {
      await prisma.inventoryItem.upsert({
        where: { id: i._id.toString() },
        update: {},
        create: {
          id: i._id.toString(),
          name: i.name,
          category: i.category,
          quantity: i.currentStock || 0,
          minStock: i.minStock || 5,
          status: i.status || 'in_stock'
        }
      });
    }

    // 7. Migrate Exams
    console.log('📝 Migrating Exams...');
    const mongoExams = await mongoDb.collection('exams').find().toArray();
    for (const e of mongoExams) {
      await prisma.exam.create({
        data: {
          id: e._id.toString(),
          name: e.name,
          type: e.type,
          classId: e.class.toString(),
          academicYearId: e.academicYear.toString(),
          startDate: e.startDate,
          endDate: e.endDate,
          status: e.status || 'scheduled'
        }
      });
    }

    console.log('✅ Migration template execution finished!');
    console.log('NOTE: Ensure all foreign keys (IDs) matched between MongoDB and SQL.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

migrate();
