import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14');
    
    // 30d sales velocity per product
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const velocityData = await prisma.transaction.groupBy({
      by: ['ProductID'],
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      _sum: { Qty: true }
    });

    const predictions = await Promise.all(velocityData.map(async (row) => {
      const product = await prisma.product.findUnique({
        where: { ProductID: row.ProductID }
      });
      
      if (!product) return null;
      
      const velocity = (row._sum.Qty || 0) / 30; // Daily avg
      const leadDays = 5; // Supplier lead time
      const safety = 1.2;
      
      const predictedNeed = velocity * leadDays * safety;
      const reorderQty = Math.max(0, Math.ceil(predictedNeed - Number(product.Quantity || 0)));
      
      return {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        CurrentStock: product.Quantity,
        Velocity: velocity.toFixed(1),
        ReorderQty: reorderQty,
        Value: Number(reorderQty) * Number(product.SellingPrice),
        reorderPoint: product.ReorderPoint
      };
    })).then(results => results.filter(Boolean));

    // Sort by urgency
    predictions.sort((a, b) => (b?.ReorderQty || 0) - (a?.ReorderQty || 0));

    return NextResponse.json({
      predictions,
      generatedAt: new Date().toISOString(),
      urgent: predictions.filter((p): p is NonNullable<typeof p> => p !== null && p.ReorderQty > 0).slice(0, 5)
    });
  } catch (error) {
    console.error('AI Reorder error:', error);
    return NextResponse.json({ error: 'AI Reorder failed' }, { status: 500 });
  }
}

