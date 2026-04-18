"use client"

import { useEffect, useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Loader2, Package, ShoppingCart, User } from "lucide-react"

export default function Page() {
  const [topProducts, setTopProducts] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAllRecent, setShowAllRecent] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [topRes, recentRes] = await Promise.all([
          fetch('/api/dashboard/top-products'),
          fetch('/api/dashboard/recent-sales')
        ])

        if (topRes.ok) setTopProducts(await topRes.json())
        if (recentRes.ok) setRecentSales(await recentRes.json())
      } catch (error) {
        console.error("Dashboard data fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />

        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 lg:px-6">
          {/* Top Selling Products */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="size-5 text-primary" />
                <div>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Worst performers excluded</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No sales data yet</div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={product.image} alt={product.name} />
                          <AvatarFallback><Package className="size-4" /></AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        ₱{product.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                <div>
                  <CardTitle>Recent Purchases</CardTitle>
                  <CardDescription>Live shop activity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              ) : recentSales.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No recent activity</div>
              ) : (
                <div className="space-y-4">
                  {(showAllRecent ? recentSales : recentSales.slice(0, 5)).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <User className="size-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{sale.product}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Customer: {sale.customer} • {format(new Date(sale.date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm text-green-600">+₱{sale.amount.toLocaleString()}</div>
                        <Badge variant="secondary" className="text-[10px] py-0 h-4">Qty: {sale.quantity}</Badge>
                      </div>
                    </div>
                  ))}
                  {recentSales.length > 5 && (
                    <button
                      onClick={() => setShowAllRecent(!showAllRecent)}
                      className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium pt-2 transition-colors cursor-pointer"
                    >
                      {showAllRecent ? 'Show Less' : `Show All (${recentSales.length})`}
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
