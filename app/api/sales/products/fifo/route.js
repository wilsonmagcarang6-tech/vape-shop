import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { cart, paymentMethod, amountPaid, Discount, ClientID, FirstName, LastName } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ message: 'Cart is empty' }, { status: 400 });
    }

    const authz = await requireRole(['admin', 'cashier']);
    if (!authz.ok) {
      return authz.response;
    }

    const session = authz.session;
    const cashierId = session.role === 'cashier' ? session.userId : null;
    const adminId = session.role === 'admin' ? session.userId : null;

    // Calculate totals on server to be safe
    const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.SellingPrice), 0);
    const safeDiscount = Math.max(0, Number(Discount) || 0);
    const discountedTotal = Math.max(0, totalAmount - safeDiscount);

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      const customerName = FirstName && LastName ? `${FirstName} ${LastName}` : null;

      const productIds = [...new Set(cart.map((item) => item.ProductID))];
      const products = await tx.product.findMany({
        where: { ProductID: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.ProductID, p]));

      for (const item of cart) {
        const product = productMap.get(item.ProductID);
        if (!product || product.Quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.ProductName}`);
        }
      }

      const billing = await tx.billing.create({
        data: {
          CustomerName: customerName,
          TotalAmount: discountedTotal,
        },
      });

      await tx.payment.create({
        data: {
          BillingID: billing.BillingID,
          Amount: amountPaid,
          Method: paymentMethod === 'GCash' ? 'GCash' : 'Cash',
        },
      });

      await tx.transaction.createMany({
        data: cart.map((item) => {
          const product = productMap.get(item.ProductID);
          return {
            ProductID: item.ProductID,
            BillingID: billing.BillingID,
            Qty: item.quantity,
            CostPrice: product.CostPrice,
            SellingPrice: item.SellingPrice,
          };
        }),
      });

      const quantityByProduct = new Map();
      for (const item of cart) {
        quantityByProduct.set(
          item.ProductID,
          (quantityByProduct.get(item.ProductID) || 0) + item.quantity
        );
      }

      for (const [productId, qty] of quantityByProduct.entries()) {
        await tx.product.update({
          where: { ProductID: productId },
          data: { Quantity: { decrement: qty } },
        });
      }

      return billing;
    }, {
      maxWait: 10000,  // max time to wait for a connection (10s)
      timeout: 60000,  // max time for the transaction to complete (60s)
    });

    return NextResponse.json({ message: 'Sale processed successfully', data: result });
  } catch (error) {
    console.error('Error processing sale:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
