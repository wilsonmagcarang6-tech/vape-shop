import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        ProductID: 'desc',
      },
    });
    return NextResponse.json({ data: products });
  } catch (error) {
    console.error('Error fetching all products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
