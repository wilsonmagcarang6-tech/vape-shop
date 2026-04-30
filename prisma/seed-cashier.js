require('dotenv').config();

const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('../generated/prisma/client');

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? "3306", 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10,
  connectTimeout: 30000,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.cashier.findUnique({
    where: { username: 'cashier' },
  });

  if (!existing) {
    await prisma.cashier.create({
      data: {
        username: 'cashier',
        password: 'cashier123',
        fullName: 'Default Cashier',
      },
    });
    console.log('Default cashier created: cashier / cashier123');
  } else {
    console.log('Cashier already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

