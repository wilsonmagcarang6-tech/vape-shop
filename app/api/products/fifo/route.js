import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany();
    
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

    return NextResponse.json({ data: fifoProducts });
  } catch (error) {
    console.error('Error fetching FIFO products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
