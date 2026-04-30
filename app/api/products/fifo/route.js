import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        skip: offset,
        take: limit,
      }),
      prisma.product.count(),
    ]);
    
    // Map existing products to the FIFO format expected by the POS page
    const fifoProducts = products.map(p => ({
      ProductID: p.ProductID,
      ProductName: p.ProductName,
      PictureURL: p.PictureURL || null,
      TotalQuantity: p.Quantity,
      SellingPrice: p.SellingPrice,
      // Create a single dummy batch for FIFO compatibility
      Batches: [
        {
          ProductID: p.ProductID,
          BatchNumber: 1,
          Quantity: p.Quantity,
          CostPrice: p.CostPrice,
          SellingPrice: p.SellingPrice,
          BasePrice: p.CostPrice,
        }
      ]
    }));

    return NextResponse.json({ 
      data: fifoProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching FIFO products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
