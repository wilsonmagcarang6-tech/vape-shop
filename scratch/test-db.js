const { PrismaClient } = require('../generated/prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
require('dotenv').config();

async function test() {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Fetching transactions...');
    const count = await prisma.transaction.count();
    console.log('Count:', count);
    const recent = await prisma.transaction.findMany({ take: 5 });
    console.log('Recent:', JSON.stringify(recent, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
