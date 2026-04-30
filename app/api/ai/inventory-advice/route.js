import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRestockRecommendation } from '@/lib/ai/forecast';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const recommendation = await getRestockRecommendation(parseInt(productId));
      return NextResponse.json({ data: recommendation });
    }

    // Get all products with their velocities and recommendations
    const products = await prisma.product.findMany({
      include: { transactions: { orderBy: { createdAt: 'asc' } } },
    });

    const recommendations = [];
    for (const product of products) {
      try {
        const rec = await getRestockRecommendation(product.ProductID);
        if (rec.recommendedQty > 0 || rec.daysUntilStockout === null || rec.daysUntilStockout <= 14) {
          recommendations.push(rec);
        }
      } catch (e) {
        // Skip products that fail
      }
    }

    // Sort by urgency: null (out of stock) first, then by daysUntilStockout ascending
    recommendations.sort((a, b) => {
      if (a.daysUntilStockout === null && b.daysUntilStockout !== null) return -1;
      if (b.daysUntilStockout === null && a.daysUntilStockout !== null) return 1;
      return (a.daysUntilStockout || 999) - (b.daysUntilStockout || 999);
    });

    return NextResponse.json({ data: recommendations });
  } catch (error) {
    console.error('Error fetching inventory advice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

