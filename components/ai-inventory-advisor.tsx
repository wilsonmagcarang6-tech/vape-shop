"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { BrainCircuit, RefreshCw, AlertTriangle, Package, TrendingUp, Clock } from "lucide-react"

interface RestockRecommendation {
  ProductID: number
  ProductName: string
  currentStock: number
  forecastedDemand30d: number
  safetyStock: number
  recommendedQty: number
  daysUntilStockout: number | null
}

export function AiInventoryAdvisor() {
  const [recommendations, setRecommendations] = useState<RestockRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRecommendations = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/ai/inventory-advice')
      if (!res.ok) throw new Error('Failed to fetch recommendations')
      const json = await res.json()
      setRecommendations(json.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load AI inventory advice')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const getUrgencyColor = (days: number | null) => {
    if (days === null) return "text-red-600 bg-red-50 border-red-200"
    if (days <= 3) return "text-red-600 bg-red-50 border-red-200"
    if (days <= 7) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  const getUrgencyLabel = (days: number | null) => {
    if (days === null) return "Out of Stock"
    if (days <= 3) return `Critical (${days}d left)`
    if (days <= 7) return `Urgent (${days}d left)`
    return `Low (${days}d left)`
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-base">AI Inventory Advisor</CardTitle>
              <CardDescription>Smart restock recommendations based on sales velocity</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchRecommendations}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">All products are well-stocked! No restock needed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.ProductID}
                className={`p-3 rounded-lg border transition-all hover:shadow-md ${getUrgencyColor(rec.daysUntilStockout)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-semibold text-sm">{rec.ProductName}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] h-5 ${getUrgencyColor(rec.daysUntilStockout)}`}>
                    {getUrgencyLabel(rec.daysUntilStockout)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">{rec.currentStock} units</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">30d Demand:</span>
                    <span className="font-medium">{rec.forecastedDemand30d} units</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Safety:</span>
                    <span className="font-medium">{rec.safetyStock} units</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-purple-600" />
                    <span className="text-muted-foreground">Reorder:</span>
                    <span className="font-bold text-purple-700">{rec.recommendedQty} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

