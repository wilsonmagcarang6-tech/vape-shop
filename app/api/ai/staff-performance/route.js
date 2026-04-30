import { NextResponse } from 'next/server';
import { calculateStaffPerformance } from '@/lib/ai/staff-analytics';
import { subDays } from 'date-fns';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const authz = await requireRole(['admin']);
    if (!authz.ok) {
      return authz.response;
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const from = fromParam ? new Date(fromParam) : subDays(new Date(), days);
    const to = toParam ? new Date(toParam) : new Date();

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const summary = await calculateStaffPerformance(from, to);

    return NextResponse.json({ data: summary });

  } catch (error) {
    console.error('Error fetching staff performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

