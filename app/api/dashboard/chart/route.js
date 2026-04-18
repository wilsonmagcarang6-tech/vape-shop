import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const ninetyDaysAgo = subDays(today, 90);

    // Fetch all billings in the last 90 days
    const billings = await prisma.billing.findMany({
      where: {
        createdAt: {
          gte: ninetyDaysAgo
        }
      },
      select: {
        createdAt: true,
        TotalAmount: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by day
    const groupedData = {};
    
    // Initialize last 90 days with 0s
    for (let i = 0; i < 90; i++) {
      const dateKey = format(subDays(today, i), 'yyyy-MM-dd');
      groupedData[dateKey] = { date: dateKey, sales: 0, transactions: 0 };
    }

    // Fill with real data
    billings.forEach(b => {
      const dateKey = format(b.createdAt, 'yyyy-MM-dd');
      if (groupedData[dateKey]) {
        groupedData[dateKey].sales += Number(b.TotalAmount);
        groupedData[dateKey].transactions += 1;
      }
    });

    // Convert back to sorted array
    const chartData = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error fetching dashboard chart data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
