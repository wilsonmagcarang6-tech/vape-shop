import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity } = body;

    const product = await prisma.product.update({
      where: { ProductID: parseInt(id) },
      data: {
        Quantity: {
          increment: parseInt(quantity),
        },
      },
    });

    return NextResponse.json({ 
      message: `Successfully restocked ${quantity} units`,
      data: product 
    });
  } catch (error) {
    console.error('Error restocking product:', error);
    return NextResponse.json(
      { error: 'Failed to restock product' },
      { status: 500 }
    );
  }
}
