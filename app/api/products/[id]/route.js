import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { ProductName, CostPrice, SellingPrice, Quantity, ReorderPoint, PictureURL } = body;

    const product = await prisma.product.update({
      where: { ProductID: parseInt(id) },
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
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    // First delete all related transactions
    await prisma.transaction.deleteMany({
      where: { ProductID: productId }
    });

    // Then delete the product
    await prisma.product.delete({
      where: { ProductID: productId },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
