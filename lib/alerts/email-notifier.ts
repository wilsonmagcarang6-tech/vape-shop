import nodemailer from 'nodemailer';
import type { LowStockItem } from './sms-message';
import { createLowStockSmsMessage } from './sms-message';
import prisma from '@/lib/prisma';

type EmailOptions = {
  gmailUser: string;
  gmailPass: string;
  recipient: string;
  shopName?: string;
};

export async function sendLowStockEmail(items: LowStockItem[], options: EmailOptions) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: options.gmailUser,
      pass: options.gmailPass,
    },
  });

  const shopName = options.shopName || 'HIPAK Vape Shop';
  const subject = `${shopName} - Low Stock Alert`;
  const body = `
<html>
<body>
<h2>${subject}</h2>
<p>Please review inventory:</p>
<ul>
${items.map(item => `<li>${item.productName}: ${item.currentStock} left (RL: ${item.reorderLevel || 'N/A'})</li>`).join('')}
</ul>
<p>Total low stock items: ${items.length}</p>
</body>
</html>
  `;

  const mailOptions = {
    from: options.gmailUser,
    to: options.recipient,
    subject,
    html: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Low stock email sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Email failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

interface ProductLowStock {
  ProductID: number;
  ProductName: string;
  Quantity: number;
  ReorderPoint: number;
}

export async function checkAndSendLowStockEmail(
  gmailUser: string, 
  gmailPass: string, 
  recipient: string, 
  shopName = 'HIPAK Vape Shop', 
  thresholdMultiplier = 1
) {
  const rawProducts: ProductLowStock[] = await prisma.product.findMany({
    where: {
      Quantity: {
        lt: prisma.product.fields.ReorderPoint,
      },
    },
    select: {
      ProductID: true,
      ProductName: true,
      Quantity: true,
      ReorderPoint: true,
    },
  });

  const lowStockItems: LowStockItem[] = rawProducts.map(p => ({
    productName: p.ProductName,
    currentStock: p.Quantity,
    reorderLevel: p.ReorderPoint,
  }));

  if (lowStockItems.length === 0) {
    console.log('No low stock items');
    return { success: true, sent: false, count: 0 };
  }

  console.log(`Found ${lowStockItems.length} low stock items`);
  const result = await sendLowStockEmail(lowStockItems, {
    gmailUser,
    gmailPass,
    recipient,
    shopName,
  });

  return {
    ...result,
    sent: result.success,
    count: lowStockItems.length,
    items: lowStockItems.slice(0, 5),
  };
}

