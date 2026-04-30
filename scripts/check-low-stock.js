#!/usr/bin/env node

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const prisma = require('@/lib/prisma');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function checkLowStock() {
  const products = await prisma.product.findMany({
    where: {
      Quantity: {
        lt: 5 // ReorderPoint default
      }
    },
    select: {
      ProductID: true,
      ProductName: true,
      Quantity: true,
      ReorderPoint: true
    }
  });

  if (products.length === 0) {
    console.log('No low stock items');
    return { success: true, sent: false, count: 0 };
  }

  console.log(`Found ${products.length} low stock items:`, products.map(p => p.ProductName));

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  const recipient = process.env.ALERT_RECIPIENT;

  if (!gmailUser || !gmailPass || !recipient) {
    console.log('Missing .env vars - skipping email');
    return { success: true, sent: false, count: products.length };
  }

  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const shopName = process.env.SHOP_NAME || 'HIPAK Vape Shop';
  const subject = `${shopName} - Low Stock Alert`;
  const body = `
<h2>${subject}</h2>
<ul>
${products.map(p => `<li>${p.ProductName}: ${p.Quantity} left (RL: ${p.ReorderPoint})</li>`).join('')}
</ul>
  `;

  try {
    await transporter.sendMail({
      from: gmailUser,
      to: recipient,
      subject,
      html: body,
    });
    console.log('✅ Email sent!');
    return { success: true, sent: true, count: products.length };
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return { success: false, sent: false, count: products.length, error: error.message };
  }
}

checkLowStock()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

