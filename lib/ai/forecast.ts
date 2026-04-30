import prisma from "@/lib/prisma";
import { subDays, format, startOfDay, addDays } from "date-fns";

export interface DailySales {
  date: string;
  actual: number;
  predicted?: number;
}

export interface ProductForecast {
  ProductID: number;
  ProductName: string;
  forecasts: DailySales[];
}

/**
 * Weighted Moving Average with linear regression trend adjustment.
 * Weights: [0.1, 0.15, 0.25, 0.5] for last 4 weeks.
 */
function weightedMovingAverage(values: number[], weights: number[]): number {
  const n = Math.min(values.length, weights.length);
  if (n === 0) return 0;
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < n; i++) {
    const idx = values.length - n + i;
    sum += values[idx] * weights[i];
    weightSum += weights[i];
  }
  return weightSum > 0 ? sum / weightSum : 0;
}

/**
 * Simple linear regression slope.
 */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Generate daily sales history and forecast for the next N days.
 * @param daysHistory How many days of history to include
 * @param daysForecast How many days to forecast ahead
 */
export async function generateSalesForecast(
  daysHistory: number = 60,
  daysForecast: number = 14
): Promise<DailySales[]> {
  const today = new Date();
  const historyStart = subDays(today, daysHistory);

  // Fetch all billings in history window
  const billings = await prisma.billing.findMany({
    where: { createdAt: { gte: historyStart } },
    select: { createdAt: true, TotalAmount: true },
  });

  // Group by day
  const historyMap: Record<string, number> = {};
  for (let i = daysHistory - 1; i >= 0; i--) {
    const d = format(subDays(today, i), "yyyy-MM-dd");
    historyMap[d] = 0;
  }

  for (const b of billings) {
    const d = format(startOfDay(b.createdAt), "yyyy-MM-dd");
    if (historyMap[d] !== undefined) {
      historyMap[d] += Number(b.TotalAmount);
    }
  }

  const historyDates = Object.keys(historyMap).sort();
  const historyValues = historyDates.map((d) => historyMap[d]);

  // Calculate WMA + trend for each forecast day
  const weights = [0.1, 0.15, 0.25, 0.5];
  const slope = linearRegressionSlope(historyValues.slice(-14)); // trend from last 14 days

  const results: DailySales[] = historyDates.map((d, i) => ({
    date: d,
    actual: historyValues[i],
  }));

  // Generate forecasts
  const lastWma = weightedMovingAverage(historyValues.slice(-7), weights);
  for (let i = 1; i <= daysForecast; i++) {
    const forecastDate = format(addDays(today, i), "yyyy-MM-dd");
    // Adjust WMA by trend slope per day
    const predicted = Math.max(0, lastWma + slope * i);
    results.push({
      date: forecastDate,
      actual: 0,
      predicted: Math.round(predicted * 100) / 100,
    });
  }

  // Also backfill predicted for last few history days for comparison
  for (let i = historyValues.length - 7; i < historyValues.length; i++) {
    const testValues = historyValues.slice(0, i);
    const pred = weightedMovingAverage(testValues.slice(-7), weights) + slope;
    results[i].predicted = Math.round(Math.max(0, pred) * 100) / 100;
  }

  return results;
}

/**
 * Forecast per-product demand for next 30 days.
 */
export async function generateProductForecasts(): Promise<ProductForecast[]> {
  const products = await prisma.product.findMany({
    include: { transactions: { orderBy: { createdAt: "asc" } } },
  });

  const today = new Date();
  const historyDays = 60;
  const forecastDays = 30;
  const weights = [0.1, 0.15, 0.25, 0.5];

  const forecasts: ProductForecast[] = [];

  for (const product of products) {
    const txs = product.transactions;
    const historyMap: Record<string, number> = {};

    for (let i = historyDays - 1; i >= 0; i--) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      historyMap[d] = 0;
    }

    for (const t of txs) {
      const d = format(startOfDay(t.createdAt), "yyyy-MM-dd");
      if (historyMap[d] !== undefined) {
        historyMap[d] += t.Qty;
      }
    }

    const historyDates = Object.keys(historyMap).sort();
    const historyValues = historyDates.map((d) => historyMap[d]);

    const slope = linearRegressionSlope(historyValues.slice(-14));
    const lastWma = weightedMovingAverage(historyValues.slice(-7), weights);

    const dailySales: DailySales[] = historyDates.map((d, i) => ({
      date: d,
      actual: historyValues[i],
    }));

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = format(addDays(today, i), "yyyy-MM-dd");
      const predicted = Math.max(0, lastWma + slope * i);
      dailySales.push({
        date: forecastDate,
        actual: 0,
        predicted: Math.round(predicted * 100) / 100,
      });
    }

    forecasts.push({
      ProductID: product.ProductID,
      ProductName: product.ProductName,
      forecasts: dailySales,
    });
  }

  return forecasts;
}

/**
 * Calculate recommended reorder quantity for a product.
 * Reorder = (forecasted_demand_next_30_days - current_stock) + safety_stock
 * Safety stock = 7 days of average velocity
 */
export async function getRestockRecommendation(productId: number): Promise<{
  ProductID: number;
  ProductName: string;
  currentStock: number;
  forecastedDemand30d: number;
  safetyStock: number;
  recommendedQty: number;
  daysUntilStockout: number | null;
}> {
  const product = await prisma.product.findUnique({
    where: { ProductID: productId },
    include: { transactions: { orderBy: { createdAt: "asc" } } },
  });

  if (!product) throw new Error("Product not found");

  const today = new Date();
  const historyDays = 60;
  const weights = [0.1, 0.15, 0.25, 0.5];

  const historyMap: Record<string, number> = {};
  for (let i = historyDays - 1; i >= 0; i--) {
    const d = format(subDays(today, i), "yyyy-MM-dd");
    historyMap[d] = 0;
  }

  for (const t of product.transactions) {
    const d = format(startOfDay(t.createdAt), "yyyy-MM-dd");
    if (historyMap[d] !== undefined) {
      historyMap[d] += t.Qty;
    }
  }

  const historyValues = Object.keys(historyMap)
    .sort()
    .map((d) => historyMap[d]);

  const avgDaily = historyValues.reduce((a, b) => a + b, 0) / historyValues.length || 0;
  const safetyStock = avgDaily * 7;

  // Forecast next 30 days
  const slope = linearRegressionSlope(historyValues.slice(-14));
  const lastWma = weightedMovingAverage(historyValues.slice(-7), weights);
  let forecastedDemand30d = 0;
  for (let i = 1; i <= 30; i++) {
    forecastedDemand30d += Math.max(0, lastWma + slope * i);
  }
  forecastedDemand30d = Math.round(forecastedDemand30d * 100) / 100;

  const recommendedQty = Math.max(0, Math.ceil(forecastedDemand30d - product.Quantity + safetyStock));
  const daysUntilStockout = avgDaily > 0 ? product.Quantity / avgDaily : product.Quantity > 0 ? Infinity : 0;

  return {
    ProductID: product.ProductID,
    ProductName: product.ProductName,
    currentStock: product.Quantity,
    forecastedDemand30d,
    safetyStock: Math.round(safetyStock * 100) / 100,
    recommendedQty,
    daysUntilStockout: daysUntilStockout === Infinity ? null : Math.round(daysUntilStockout * 10) / 10,
  };
}

