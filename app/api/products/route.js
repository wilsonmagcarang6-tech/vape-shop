import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ProductName, CostPrice, SellingPrice, Quantity, ReorderPoint, PictureURL } = body;

    const product = await prisma.product.create({
      data: {
        ProductName,
        CostPrice: parseFloat(CostPrice),
        SellingPrice: parseFloat(SellingPrice),
        Quantity: parseInt(Quantity),
        ReorderPoint: parseInt(ReorderPoint),
        PictureURL: PictureURL || null,
      },
    });

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
