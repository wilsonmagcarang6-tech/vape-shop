"use client"

import { AiInsightsPanel } from "@/components/ai-insights-panel"
import { AiForecastChart } from "@/components/ai-forecast-chart"
import { AiInventoryAdvisor } from "@/components/ai-inventory-advisor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BrainCircuit, TrendingUp, Package, MessageSquare } from "lucide-react"

export default function AiAssistantPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Business Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Smart analytics, forecasting, and insights powered by your shop data
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <BrainCircuit className="h-3 w-3 mr-1" />
          Algorithmic AI
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm font-medium">Sales Forecasting</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              14-day sales predictions using weighted moving average + linear regression on your historical data.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-sm font-medium">Inventory Intelligence</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Smart restock recommendations based on sales velocity, demand forecasting, and safety stock calculations.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-sm font-medium">Natural Language Queries</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ask questions in plain English about sales, profits, inventory, and top products. No API keys needed.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <AiForecastChart />

      {/* Insights + Advisor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AiInsightsPanel />
        <AiInventoryAdvisor />
      </div>
    </div>
  )
}

