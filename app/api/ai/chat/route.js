import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subDays, format } from 'date-fns';

function parseIntent(message) {
  const lower = message.toLowerCase();

  if (/total sales|revenue|how much.*(earn|make|sold)/.test(lower)) {
    return { intent: 'total_sales', period: extractPeriod(lower) };
  }
  if (/best seller|top product|most sold|highest selling/.test(lower)) {
    return { intent: 'top_products', limit: extractNumber(lower) || 5 };
  }
  if (/low stock|out of stock|running out|need to restock/.test(lower)) {
    return { intent: 'low_stock' };
  }
  if (/inventory value|worth of stock|asset value/.test(lower)) {
    return { intent: 'inventory_value' };
  }
  if (/profit|net revenue|earnings/.test(lower)) {
    return { intent: 'profit', period: extractPeriod(lower) };
  }
  if (/transaction count|how many sales|number of orders/.test(lower)) {
    return { intent: 'transaction_count', period: extractPeriod(lower) };
  }
  if (/help|what can you do|commands/.test(lower)) {
    return { intent: 'help' };
  }
  return { intent: 'unknown' };
}

function extractPeriod(text) {
  if (/today/.test(text)) return 'today';
  if (/yesterday/.test(text)) return 'yesterday';
  if (/last week|past week/.test(text)) return 'last_week';
  if (/last month|past month/.test(text)) return 'last_month';
  if (/this week/.test(text)) return 'this_week';
  if (/this month/.test(text)) return 'this_month';
  return 'all_time';
}

function extractNumber(text) {
  const match = text.match(/\b(\d+)\b/);
  return match ? parseInt(match[1]) : null;
}

function getDateRange(period) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  switch (period) {
    case 'today':
      return { gte: startOfToday };
    case 'yesterday':
      const yesterday = subDays(startOfToday, 1);
      return { gte: yesterday, lt: startOfToday };
    case 'this_week':
      return { gte: subDays(startOfToday, today.getDay()) };
    case 'last_week':
      const lastWeekStart = subDays(startOfToday, today.getDay() + 7);
      const lastWeekEnd = subDays(startOfToday, today.getDay());
      return { gte: lastWeekStart, lt: lastWeekEnd };
    case 'this_month':
      return { gte: new Date(today.getFullYear(), today.getMonth(), 1) };
    case 'last_month':
      return { gte: new Date(today.getFullYear(), today.getMonth() - 1, 1), lt: new Date(today.getFullYear(), today.getMonth(), 1) };
    default:
      return undefined;
  }
}

export async function POST(request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: 'Please ask me a question.' });
    }

    const intent = parseIntent(message);
    let reply = '';

    switch (intent.intent) {
      case 'total_sales': {
        const dateRange = getDateRange(intent.period);
        const billings = await prisma.billing.findMany({
          where: dateRange ? { createdAt: dateRange } : undefined,
          select: { TotalAmount: true },
        });
        const total = billings.reduce((sum, b) => sum + Number(b.TotalAmount), 0);
        const periodLabel = intent.period.replace(/_/g, ' ');
        reply = `Total sales ${periodLabel === 'all time' ? '' : `for ${periodLabel}`}is **₱${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.`;
        break;
      }

      case 'top_products': {
        const transactions = await prisma.transaction.findMany({
          include: { product: true },
          take: 1000,
        });
        const productSales = {};
        transactions.forEach((t) => {
          const id = t.ProductID;
          if (!productSales[id]) {
            productSales[id] = { name: t.product.ProductName, qty: 0, revenue: 0 };
          }
          productSales[id].qty += t.Qty;
          productSales[id].revenue += t.Qty * Number(t.SellingPrice);
        });
        const top = Object.values(productSales)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, intent.limit);
        if (top.length === 0) {
          reply = 'No sales data available yet.';
        } else {
          reply = `Here are your top ${top.length} products:\n\n` +
            top.map((p, i) => `${i + 1}. **${p.name}** — ${p.qty} units sold (₱${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })})`).join('\n');
        }
        break;
      }

      case 'low_stock': {
        const products = await prisma.product.findMany();
        const low = products.filter((p) => p.Quantity <= p.ReorderPoint && p.Quantity > 0);
        const out = products.filter((p) => p.Quantity <= 0);
        if (out.length === 0 && low.length === 0) {
          reply = 'All products are well-stocked. No action needed!';
        } else {
          const parts = [];
          if (out.length > 0) parts.push(`**${out.length} out of stock**: ${out.map((p) => p.ProductName).join(', ')}`);
          if (low.length > 0) parts.push(`**${low.length} low stock**: ${low.map((p) => p.ProductName).join(', ')}`);
          reply = parts.join('\n\n');
        }
        break;
      }

      case 'inventory_value': {
        const products = await prisma.product.findMany();
        const value = products.reduce((sum, p) => sum + p.Quantity * Number(p.CostPrice), 0);
        reply = `Your current inventory is worth **₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}** at cost price.`;
        break;
      }

      case 'profit': {
        const dateRange = getDateRange(intent.period);
        const txs = await prisma.transaction.findMany({
          where: dateRange ? { createdAt: dateRange } : undefined,
          select: { Qty: true, SellingPrice: true, CostPrice: true },
        });
        const profit = txs.reduce((sum, t) => sum + t.Qty * (Number(t.SellingPrice) - Number(t.CostPrice)), 0);
        const periodLabel = intent.period.replace(/_/g, ' ');
        reply = `Total profit ${periodLabel === 'all time' ? '' : `for ${periodLabel}`}is **₱${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.`;
        break;
      }

      case 'transaction_count': {
        const dateRange = getDateRange(intent.period);
        const count = await prisma.billing.count({
          where: dateRange ? { createdAt: dateRange } : undefined,
        });
        const periodLabel = intent.period.replace(/_/g, ' ');
        reply = `There ${count === 1 ? 'was' : 'were'} **${count} transaction${count === 1 ? '' : 's'}** ${periodLabel === 'all time' ? 'in total' : `for ${periodLabel}`}.`;
        break;
      }

      case 'help': {
        reply = `Here is what I can help you with:\n\n` +
          `• **Sales**: "Total sales today/last week/this month"\n` +
          `• **Profit**: "What is the profit this week?"\n` +
          `• **Top Products**: "What are the top 5 best sellers?"\n` +
          `• **Inventory**: "What products are low stock?" or "Inventory value"\n` +
          `• **Transactions**: "How many sales today?"\n\n` +
          `Just ask in natural language!`;
        break;
      }

      default: {
        reply = `I'm not sure I understood that. Try asking about sales, profit, top products, low stock, or transaction counts. Type "help" for examples.`;
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ reply: 'Sorry, I encountered an error processing your request.' }, { status: 500 });
  }
}

