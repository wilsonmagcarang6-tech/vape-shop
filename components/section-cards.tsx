"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, PackageIcon, AlertTriangleIcon, DollarSignIcon, ShoppingBagIcon, Loader2 } from "lucide-react"

export function SectionCards() {
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    lowStock: 0,
    transactions: 0,
    inventoryValue: 0,
    totalSales: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/summary')
        const data = await res.json()
        if (res.ok) setStats({
          ...data,
          totalSales: data.revenue // For clarity, treat revenue as total sales, profit as revenue (profit)
        })
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-500">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-32 flex items-center justify-center border-dashed">
            <Loader2 className="animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card animate-in zoom-in-95 duration-500">
      {/* Total Sales Card */}
      <Card className="@container/card shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>Total Sales</CardDescription>
            <DollarSignIcon className="size-4 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
              All Sales (Gross)
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Total Revenue (Profit) Card */}
      <Card className="@container/card shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>Total Revenue</CardDescription>
            <TrendingUpIcon className="size-4 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-emerald-600">
            ₱{stats.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
              Net Revenue (Profit)
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Low Stock Alerts Card */}
      <Card className="@container/card shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>Low Stock Alerts</CardDescription>
            <AlertTriangleIcon className="size-4 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.lowStock} Items
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={stats.lowStock > 0 ? "text-red-600 bg-red-50 border-red-200" : "text-green-600 bg-green-50 border-green-200"}>
              {stats.lowStock > 0 ? "Action Required" : "All Good"}
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Inventory Value Card */}
      <Card className="@container/card shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>Inventory Value</CardDescription>
            <PackageIcon className="size-4 text-purple-500" />
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ₱{stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200 font-medium">
              Asset Value
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}
