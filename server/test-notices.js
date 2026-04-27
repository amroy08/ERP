const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  const user = await prisma.user.findFirst({ where: { role: 'student' } });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret-key-12345');
  console.log('Student token:', token);
}
run();
