const { PrismaClient } = require('../generated/prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 1,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {
        password: 'admin123',
      },
      create: {
        username: 'admin',
        password: 'admin123',
      },
    });
    console.log('Admin seeded:', admin);
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
