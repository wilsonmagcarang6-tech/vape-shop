import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { cart, paymentMethod, amountPaid, Discount, ClientID, FirstName, LastName } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ message: 'Cart is empty' }, { status: 400 });
    }

    // Calculate totals on server to be safe
    const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.SellingPrice), 0);
    const discountedTotal = totalAmount - (Discount || 0);

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the billing record
      const customerName = FirstName && LastName ? `${FirstName} ${LastName}` : null;
      
      const billing = await tx.billing.create({
        data: {
          CustomerName: customerName,
          TotalAmount: discountedTotal,
        },
      });

      // 2. Create transaction records and update inventory
      for (const item of cart) {
        // Double check stock first
        const product = await tx.product.findUnique({
          where: { ProductID: item.ProductID }
        });

        if (!product || product.Quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.ProductName}`);
        }

        // Create the transaction record (line item)
        await tx.transaction.create({
          data: {
            ProductID: item.ProductID,
            BillingID: billing.BillingID,
            Qty: item.quantity,
            CostPrice: product.CostPrice,
            SellingPrice: item.SellingPrice,
          },
        });

        // Update product quantity
        await tx.product.update({
          where: { ProductID: item.ProductID },
          data: {
            Quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // 3. Create the payment record
      await tx.payment.create({
        data: {
          BillingID: billing.BillingID,
          Amount: amountPaid,
          Method: paymentMethod === 'GCash' ? 'GCash' : 'Cash',
        },
      });

      return billing;
    }, {
      maxWait: 10000,  // max time to wait for a connection (10s)
      timeout: 30000,  // max time for the transaction to complete (30s)
    });

    return NextResponse.json({ message: 'Sale processed successfully', data: result });
  } catch (error) {
    console.error('Error processing sale:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
