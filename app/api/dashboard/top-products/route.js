import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Group transactions by ProductID and sum Qty
    const topProductsRaw = await prisma.transaction.groupBy({
      by: ['ProductID'],
      _sum: {
        Qty: true,
        SellingPrice: true // This is not quite correct for revenue (needs Qty * SellingPrice), butgroupBy is limited
      },
      orderBy: {
        _sum: {
          Qty: 'desc'
        }
      },
      take: 5
    });

    // 2. Fetch product details and calculate revenue properly
    const topProducts = await Promise.all(
      topProductsRaw.map(async (row) => {
        const product = await prisma.product.findUnique({
          where: { ProductID: row.ProductID },
          select: { ProductName: true }
        });

        // Get all transactions for this product to calculate real total revenue
        const transactions = await prisma.transaction.findMany({
          where: { ProductID: row.ProductID },
          select: { Qty: true, SellingPrice: true }
        });

        const revenue = transactions.reduce((sum, t) => sum + (t.Qty * Number(t.SellingPrice)), 0);

        return {
          id: row.ProductID,
          name: product?.ProductName || 'Unknown',
          image: null,
          quantity: row._sum.Qty,
          revenue: revenue
        };
      })
    );

    return NextResponse.json(topProducts);
  } catch (error) {
    console.error('Error fetching dashboard top products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
