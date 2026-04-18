import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const ninetyDaysAgo = subDays(today, 90);

    // Fetch all transactions in the last 90 days
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: ninetyDaysAgo
        }
      },
      select: {
        createdAt: true,
        Qty: true,
        SellingPrice: true,
        BillingID: true
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

    // Track unique billings per day to count transactions accurately
    const billingsByDay = {};

    // Fill with real data from transactions
    transactions.forEach(t => {
      const dateKey = format(t.createdAt, 'yyyy-MM-dd');
      if (groupedData[dateKey]) {
        groupedData[dateKey].sales += t.Qty * Number(t.SellingPrice);
        
        // Count unique billings per day for transaction count
        if (!billingsByDay[dateKey]) {
          billingsByDay[dateKey] = new Set();
        }
        billingsByDay[dateKey].add(t.BillingID);
      }
    });

    // Update transaction counts with unique billings
    Object.keys(billingsByDay).forEach(dateKey => {
      groupedData[dateKey].transactions = billingsByDay[dateKey].size;
    });

    // Convert back to sorted array
    const chartData = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error fetching dashboard chart data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
