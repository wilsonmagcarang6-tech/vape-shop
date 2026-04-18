import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const isReport = searchParams.get('report') === 'true';

    // Fetch transactions with related product and billing info
    const transactions = await prisma.transaction.findMany({
      include: {
        product: true,
        billing: {
          include: {
            payments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map to format expected by Reports page
    const reportData = transactions.map(t => ({
      TransactionID: t.TransactionID,
      ProductID: t.ProductID,
      Qty: t.Qty,
      Amount: Number(t.SellingPrice) * t.Qty,
      CostPrice: Number(t.CostPrice),
      UnitSellingPrice: Number(t.SellingPrice),
      Profit: (Number(t.SellingPrice) - Number(t.CostPrice)) * t.Qty,
      TransactionDate: t.createdAt,
      product: t.product,
      billing: {
        BillingID: t.billing.BillingID,
        FirstName: t.billing.CustomerName?.split(' ')[0] || '-',
        LastName: t.billing.CustomerName?.split(' ').slice(1).join(' ') || '',
        client: null // If you have a separate client model later
      }
    }));

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching sales for report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
