import prisma from "@/lib/prisma";
import { subDays, format, startOfDay, differenceInDays } from "date-fns";

export interface ProductVelocity {
  ProductID: number;
  ProductName: string;
  dailyVelocity: number;
  weeklyVelocity: number;
  daysUntilStockout: number | null;
  trend: "rising" | "falling" | "stable";
  trendPercent: number;
}

export interface BusinessInsight {
  category: "sales" | "inventory" | "general";
  title: string;
  message: string;
  severity: "info" | "warning" | "success" | "danger";
  metadata?: Record<string, any>;
}

/**
 * Calculate sales velocity and trend for each product.
 */
export async function calculateProductVelocities(): Promise<ProductVelocity[]> {
  const products = await prisma.product.findMany({
    include: { transactions: { orderBy: { createdAt: "asc" } } },
  });

  const today = new Date();
  const velocities: ProductVelocity[] = [];

  for (const product of products) {
    const txs = product.transactions;
    if (txs.length === 0) {
      velocities.push({
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        dailyVelocity: 0,
        weeklyVelocity: 0,
        daysUntilStockout: product.Quantity > 0 ? Infinity : 0,
        trend: "stable",
        trendPercent: 0,
      });
      continue;
    }

    // Daily velocity over last 30 days
    const last30Days = subDays(today, 30);
    const recentTxs = txs.filter((t) => t.createdAt >= last30Days);
    const totalRecentQty = recentTxs.reduce((sum, t) => sum + t.Qty, 0);
    const dailyVelocity = totalRecentQty / 30;
    const weeklyVelocity = dailyVelocity * 7;

    // Days until stockout
    const daysUntilStockout =
      dailyVelocity > 0 ? product.Quantity / dailyVelocity : product.Quantity > 0 ? Infinity : 0;

    // Trend: compare last 7 days vs previous 7 days
    const last7 = subDays(today, 7);
    const prev7 = subDays(today, 14);
    const last7Qty = txs
      .filter((t) => t.createdAt >= last7)
      .reduce((sum, t) => sum + t.Qty, 0);
    const prev7Qty = txs
      .filter((t) => t.createdAt >= prev7 && t.createdAt < last7)
      .reduce((sum, t) => sum + t.Qty, 0);

    let trend: ProductVelocity["trend"] = "stable";
    let trendPercent = 0;
    if (prev7Qty > 0) {
      trendPercent = ((last7Qty - prev7Qty) / prev7Qty) * 100;
      if (trendPercent > 10) trend = "rising";
      else if (trendPercent < -10) trend = "falling";
    } else if (last7Qty > 0) {
      trend = "rising";
      trendPercent = 100;
    }

    velocities.push({
      ProductID: product.ProductID,
      ProductName: product.ProductName,
      dailyVelocity: Math.round(dailyVelocity * 100) / 100,
      weeklyVelocity: Math.round(weeklyVelocity * 100) / 100,
      daysUntilStockout:
        daysUntilStockout === Infinity ? null : Math.round(daysUntilStockout * 10) / 10,
      trend,
      trendPercent: Math.round(trendPercent * 10) / 10,
    });
  }

  return velocities;
}

/**
 * Generate AI business insights based on current data.
 */
export async function generateInsights(): Promise<BusinessInsight[]> {
  const insights: BusinessInsight[] = [];
  const today = new Date();

  // 1. Sales trend insights
  const last7DaysStart = subDays(today, 7);
  const prev7DaysStart = subDays(today, 14);

  const [recentBillings, prevBillings, allProducts, velocities] = await Promise.all([
    prisma.billing.findMany({
      where: { createdAt: { gte: last7DaysStart } },
      select: { TotalAmount: true, createdAt: true },
    }),
    prisma.billing.findMany({
      where: { createdAt: { gte: prev7DaysStart, lt: last7DaysStart } },
      select: { TotalAmount: true },
    }),
    prisma.product.findMany(),
    calculateProductVelocities(),
  ]);

  const recentRevenue = recentBillings.reduce((sum, b) => sum + Number(b.TotalAmount), 0);
  const prevRevenue = prevBillings.reduce((sum, b) => sum + Number(b.TotalAmount), 0);

  if (prevRevenue > 0) {
    const growth = ((recentRevenue - prevRevenue) / prevRevenue) * 100;
    if (growth > 20) {
      insights.push({
        category: "sales",
        title: "Sales Boom! ",
        message: `Sales are up ${growth.toFixed(1)}% this week compared to last week. Revenue reached ₱${recentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Consider increasing stock for fast-moving items.`,
        severity: "success",
        metadata: { growth, recentRevenue },
      });
    } else if (growth < -20) {
      insights.push({
        category: "sales",
        title: "Sales Decline",
        message: `Sales dropped ${Math.abs(growth).toFixed(1)}% this week. Revenue was ₱${recentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Consider running promotions or checking competitor pricing.`,
        severity: "warning",
        metadata: { growth, recentRevenue },
      });
    } else {
      insights.push({
        category: "sales",
        title: "Sales Stable",
        message: `Sales are stable with a ${growth.toFixed(1)}% change this week. Revenue: ₱${recentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`,
        severity: "info",
        metadata: { growth, recentRevenue },
      });
    }
  } else if (recentRevenue > 0) {
    insights.push({
      category: "sales",
      title: "New Sales Activity",
      message: `You recorded ₱${recentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} in sales this week. Great start!`,
      severity: "success",
    });
  }

  // 2. Inventory insights
  const lowStockProducts = allProducts.filter((p) => p.Quantity <= p.ReorderPoint && p.Quantity > 0);
  const outOfStockProducts = allProducts.filter((p) => p.Quantity <= 0);

  if (outOfStockProducts.length > 0) {
    insights.push({
      category: "inventory",
      title: "Out of Stock Alert",
      message: `${outOfStockProducts.length} product(s) are completely out of stock: ${outOfStockProducts.map((p) => p.ProductName).join(", ")}. Restock immediately to avoid lost sales.`,
      severity: "danger",
      metadata: { count: outOfStockProducts.length, products: outOfStockProducts.map((p) => p.ProductName) },
    });
  }

  if (lowStockProducts.length > 0) {
    insights.push({
      category: "inventory",
      title: "Low Stock Warning",
      message: `${lowStockProducts.length} product(s) are below reorder point: ${lowStockProducts.map((p) => p.ProductName).join(", ")}. Consider restocking soon.`,
      severity: "warning",
      metadata: { count: lowStockProducts.length, products: lowStockProducts.map((p) => p.ProductName) },
    });
  }

  // 3. Velocity-based predictions
  const stockoutRisk = velocities.filter(
    (v) => v.daysUntilStockout !== null && v.daysUntilStockout > 0 && v.daysUntilStockout <= 7
  );
  if (stockoutRisk.length > 0) {
    const names = stockoutRisk.map((v) => v.ProductName).join(", ");
    insights.push({
      category: "inventory",
      title: "Stockout Risk",
      message: `Based on recent sales velocity, these products may stock out within 7 days: ${names}.`,
      severity: "danger",
      metadata: { products: stockoutRisk },
    });
  }

  // 4. Top performer insights
  const topVelocity = [...velocities].sort((a, b) => b.dailyVelocity - a.dailyVelocity)[0];
  if (topVelocity && topVelocity.dailyVelocity > 0) {
    insights.push({
      category: "sales",
      title: "Top Performer",
      message: `"${topVelocity.ProductName}" is your best-selling product with ${topVelocity.dailyVelocity} units sold per day on average.`,
      severity: "success",
      metadata: { product: topVelocity },
    });
  }

  // 5. Rising trend products
  const risingProducts = velocities.filter((v) => v.trend === "rising" && v.dailyVelocity > 0);
  if (risingProducts.length > 0) {
    insights.push({
      category: "sales",
      title: "Trending Products",
      message: `${risingProducts.length} product(s) show rising demand: ${risingProducts.map((p) => `${p.ProductName} (+${p.trendPercent}%)`).join(", ")}.`,
      severity: "info",
      metadata: { products: risingProducts },
    });
  }

  return insights;
}

/**
 * Persist insights to database.
 */
export async function persistInsights(insights: BusinessInsight[]) {
  const data = insights.map((i) => ({
    category: i.category,
    title: i.title,
    message: i.message,
    severity: i.severity,
    metadata: i.metadata ? JSON.stringify(i.metadata) : null,
  }));

  await prisma.aiInsight.createMany({ data });
}

/**
 * Get latest insights (optionally unread only).
 */
export async function getLatestInsights(limit: number = 20, unreadOnly: boolean = false) {
  return prisma.aiInsight.findMany({
    where: unreadOnly ? { isRead: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

