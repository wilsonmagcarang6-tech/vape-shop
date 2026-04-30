import { NextResponse } from 'next/server';
import { generateInsights, getLatestInsights, persistInsights } from '@/lib/ai/analytics';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    if (refresh) {
      const newInsights = await generateInsights();
      await persistInsights(newInsights);
    }

    const insights = await getLatestInsights(limit, unreadOnly);
    return NextResponse.json({ data: insights });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, isRead } = await request.json();
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const updated = await prisma.aiInsight.update({
      where: { id },
      data: { isRead },
    });
    await prisma.$disconnect();
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

