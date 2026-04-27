import prisma from './prisma';

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ MySQL connected successfully via Prisma');
  } catch (error) {
    console.error('❌ MySQL connection error:', error);
    process.exit(1);
  }
};
