import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching recent transactions...');
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        product: {
          select: {
            ProductName: true
          }
        },
        billing: {
          select: {
            CustomerName: true
          }
        }
      }
    });

    const formattedData = recentTransactions.map(t => ({
      id: t.TransactionID,
      product: t.product?.ProductName || 'Unknown',
      image: null,
      customer: t.billing?.CustomerName || '-',
      amount: Number(t.SellingPrice) * t.Qty,
      quantity: t.Qty,
      date: t.createdAt
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
