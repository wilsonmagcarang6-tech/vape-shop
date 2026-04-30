import prisma from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, differenceInHours } from "date-fns";

export interface StaffPerformanceMetrics {
  staffId: number;
  staffName: string;
  staffType: "cashier" | "admin";
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  itemsSold: number;
  averageTransactionValue: number;
  averageItemsPerTransaction: number;
  salesPerActiveHour: number;
  lowStockSales: number;
  lowStockIncidentRate: number;
  efficiencyScore: number;
  trend: "rising" | "falling" | "stable";
  trendPercent: number;
  dailyStats: DailyStat[];
  topProducts: TopProduct[];
}

export interface DailyStat {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
  itemsSold: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface StaffPerformanceSummary {
  staff: StaffPerformanceMetrics[];
  overall: {
    totalStaffSales: number;
    totalStaffProfit: number;
    totalTransactions: number;
    topPerformer: StaffPerformanceMetrics | null;
    bestAtv: StaffPerformanceMetrics | null;
    mostEfficient: StaffPerformanceMetrics | null;
  };
  cashierOverall: {
    totalSales: number;
    totalProfit: number;
    totalTransactions: number;
    topPerformer: StaffPerformanceMetrics | null;
  } | null;
  adminOverall: {
    totalSales: number;
    totalProfit: number;
    totalTransactions: number;
    topPerformer: StaffPerformanceMetrics | null;
  } | null;
}

type BillingWithRelations = {
  BillingID: number;
  CustomerName: string | null;
  TotalAmount: number | { toString(): string };
  createdAt: Date;
  CashierID?: number | null;
  AdminID?: number | null;
  cashier?: {
    CashierID: number;
    username: string;
    fullName: string | null;
  } | null;
  admin?: {
    AdminID: number;
    username: string;
  } | null;
  transactions: Array<{
    ProductID: number;
    Qty: number;
    CostPrice: number | { toString(): string };
    SellingPrice: number | { toString(): string };
    product: {
      ProductName: string;
      Quantity: number;
      ReorderPoint: number;
    };
  }>;
};

/**
 * Calculate staff performance for a given date range.
 */
export async function calculateStaffPerformance(
  from: Date = subDays(new Date(), 30),
  to: Date = new Date()
): Promise<StaffPerformanceSummary> {
  const fromStart = startOfDay(from);
  const toEnd = endOfDay(to);

  // NOTE:
  // Keep query minimal and resilient against client/schema drift.
  const rawBillings = await prisma.billing.findMany({
    where: {
      createdAt: { gte: fromStart, lte: toEnd },
    },
    include: {
      cashier: {
        select: {
          CashierID: true,
          username: true,
          fullName: true,
        },
      },
      admin: {
        select: {
          AdminID: true,
          username: true,
        },
      },
      transactions: { include: { product: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const billings = rawBillings as unknown as BillingWithRelations[];

  // Group by staff member
  const staffMap = new Map<string, StaffAccumulator>();

  // Fallback: if staff attribution is missing, bucket under a stable profile.
  const fallbackStaffId = 0;
  const fallbackStaffType: "cashier" | "admin" = "admin";
  const fallbackStaffName = "System (Unattributed)";

  for (const billing of billings) {
    let staffId = fallbackStaffId;
    let staffType: "cashier" | "admin" = fallbackStaffType;
    let staffName = fallbackStaffName;

    if (billing.CashierID && billing.cashier) {
      staffId = billing.cashier.CashierID;
      staffType = "cashier";
      staffName = billing.cashier.fullName || billing.cashier.username;
    } else if (billing.AdminID && billing.admin) {
      staffId = billing.admin.AdminID;
      staffType = "admin";
      staffName = billing.admin.username;
    }

    const staffKey = `${staffType}-${staffId}`;

    if (!staffMap.has(staffKey)) {
      staffMap.set(staffKey, {
        staffId,
        staffName,
        staffType,
        totalSales: 0,
        totalProfit: 0,
        transactionCount: 0,
        itemsSold: 0,
        lowStockSales: 0,
        billings: [],
        productSales: new Map<number, TopProduct>(),
      });
    }

    const acc = staffMap.get(staffKey)!;
    const billingTotal = Number(billing.TotalAmount);
    let billingProfit = 0;
    let billingItems = 0;

    for (const tx of billing.transactions) {
      const txRevenue = Number(tx.SellingPrice) * tx.Qty;
      const txCost = Number(tx.CostPrice) * tx.Qty;
      billingProfit += txRevenue - txCost;
      billingItems += tx.Qty;

      const pid = tx.ProductID;
      const existing = acc.productSales.get(pid) || {
        productId: pid,
        productName: tx.product.ProductName,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += tx.Qty;
      existing.revenue += txRevenue;
      acc.productSales.set(pid, existing);
    }

    const hadLowStockItem = billing.transactions.some(
      (tx) => tx.product.Quantity <= tx.product.ReorderPoint
    );
    if (hadLowStockItem) acc.lowStockSales += 1;

    acc.totalSales += billingTotal;
    acc.totalProfit += billingProfit;
    acc.transactionCount += 1;
    acc.itemsSold += billingItems;
    acc.billings.push(billing);
  }

  const staffMetrics: StaffPerformanceMetrics[] = [];

  for (const acc of staffMap.values()) {
    const atv = acc.transactionCount > 0 ? acc.totalSales / acc.transactionCount : 0;
    const ipt = acc.transactionCount > 0 ? acc.itemsSold / acc.transactionCount : 0;

    const firstBilling = acc.billings[0]?.createdAt;
    const lastBilling = acc.billings[acc.billings.length - 1]?.createdAt;
    let activeHours = 1;
    if (firstBilling && lastBilling) {
      activeHours = Math.max(differenceInHours(lastBilling, firstBilling), 1);
    }
    const salesPerHour = acc.totalSales / activeHours;

    const lowStockRate = acc.transactionCount > 0 ? (acc.lowStockSales / acc.transactionCount) * 100 : 0;
    const atvScore = Math.min(atv / 1000, 1) * 100;
    const velocityScore = Math.min(salesPerHour / 5000, 1) * 100;
    const accuracyScore = Math.max(0, 100 - lowStockRate * 10);
    const efficiencyScore = Math.round(atvScore * 0.3 + velocityScore * 0.4 + accuracyScore * 0.3);

    const dailyMap = new Map<string, DailyStat>();
    for (const billing of acc.billings) {
      const d = billing.createdAt.toISOString().split("T")[0];
      if (!dailyMap.has(d)) {
        dailyMap.set(d, { date: d, sales: 0, profit: 0, transactions: 0, itemsSold: 0 });
      }
      const ds = dailyMap.get(d)!;
      ds.transactions += 1;
      ds.itemsSold += billing.transactions.reduce((sum: number, t) => sum + t.Qty, 0);
      ds.sales += Number(billing.TotalAmount);

      let dayProfit = 0;
      for (const tx of billing.transactions) {
        dayProfit += (Number(tx.SellingPrice) - Number(tx.CostPrice)) * tx.Qty;
      }
      ds.profit += dayProfit;
    }

    const dailyStats = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    let trend: "rising" | "falling" | "stable" = "stable";
    let trendPercent = 0;
    if (dailyStats.length >= 4) {
      const mid = Math.floor(dailyStats.length / 2);
      const firstHalf = dailyStats.slice(0, mid).reduce((sum: number, d) => sum + d.sales, 0);
      const secondHalf = dailyStats.slice(mid).reduce((sum: number, d) => sum + d.sales, 0);
      if (firstHalf > 0) {
        trendPercent = ((secondHalf - firstHalf) / firstHalf) * 100;
        if (trendPercent > 10) trend = "rising";
        else if (trendPercent < -10) trend = "falling";
      }
    }

    const topProducts = Array.from(acc.productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    staffMetrics.push({
      staffId: acc.staffId,
      staffName: acc.staffName,
      staffType: acc.staffType,
      totalSales: Math.round(acc.totalSales * 100) / 100,
      totalProfit: Math.round(acc.totalProfit * 100) / 100,
      transactionCount: acc.transactionCount,
      itemsSold: acc.itemsSold,
      averageTransactionValue: Math.round(atv * 100) / 100,
      averageItemsPerTransaction: Math.round(ipt * 100) / 100,
      salesPerActiveHour: Math.round(salesPerHour * 100) / 100,
      lowStockSales: acc.lowStockSales,
      lowStockIncidentRate: Math.round(lowStockRate * 100) / 100,
      efficiencyScore,
      trend,
      trendPercent: Math.round(trendPercent * 100) / 100,
      dailyStats,
      topProducts,
    });
  }

  staffMetrics.sort((a, b) => b.totalSales - a.totalSales);

  const overall = {
    totalStaffSales: staffMetrics.reduce((sum, m) => sum + m.totalSales, 0),
    totalStaffProfit: staffMetrics.reduce((sum, m) => sum + m.totalProfit, 0),
    totalTransactions: staffMetrics.reduce((sum, m) => sum + m.transactionCount, 0),
    topPerformer: staffMetrics[0] || null,
    bestAtv:
      staffMetrics.length > 0
        ? staffMetrics.reduce((best, m) =>
            m.averageTransactionValue > best.averageTransactionValue ? m : best
          )
        : null,
    mostEfficient:
      staffMetrics.length > 0
        ? staffMetrics.reduce((best, m) => (m.efficiencyScore > best.efficiencyScore ? m : best))
        : null,
  };

  const cashierStats = staffMetrics.filter(m => m.staffType === 'cashier');
  const cashierOverall = cashierStats.length > 0 ? {
    totalSales: cashierStats.reduce((sum, m) => sum + m.totalSales, 0),
    totalProfit: cashierStats.reduce((sum, m) => sum + m.totalProfit, 0),
    totalTransactions: cashierStats.reduce((sum, m) => sum + m.transactionCount, 0),
    topPerformer: cashierStats[0] || null,
  } : null;

  const adminStats = staffMetrics.filter(m => m.staffType === 'admin');
  const adminOverall = adminStats.length > 0 ? {
    totalSales: adminStats.reduce((sum, m) => sum + m.totalSales, 0),
    totalProfit: adminStats.reduce((sum, m) => sum + m.totalProfit, 0),
    totalTransactions: adminStats.reduce((sum, m) => sum + m.transactionCount, 0),
    topPerformer: adminStats[0] || null,
  } : null;

  return { staff: staffMetrics, overall, cashierOverall, adminOverall };

}

interface StaffAccumulator {
  staffId: number;
  staffName: string;
  staffType: "cashier" | "admin";
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  itemsSold: number;
  lowStockSales: number;
  billings: BillingWithRelations[];
  productSales: Map<number, TopProduct>;
}

