"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  BrainCircuit,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X
} from "lucide-react"

interface Insight {
  id: number
  category: string
  title: string
  message: string
  severity: "info" | "warning" | "success" | "danger"
  createdAt: string
  isRead: boolean
}

const severityConfig = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  danger: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" },
}

export function AiInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchInsights = async (refresh = false) => {
    try {
      setRefreshing(refresh)
      const res = await fetch(`/api/ai/insights?limit=10${refresh ? '&refresh=true' : ''}`)
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        const message = json?.error || json?.message || 'Failed to fetch insights'
        setLoadError(message)
        if (refresh) {
          toast.error(message)
        }
        return
      }

      setLoadError(null)
      setInsights(json?.data || [])
      if (refresh) toast.success('AI insights refreshed!')
    } catch (error) {
      console.error(error)
      setLoadError('Failed to load AI insights')
      if (refresh) {
        toast.error('Failed to load AI insights')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchInsights(true) // Generate on first load
  }, [])

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/ai/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      })
      setInsights(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i))
    } catch (error) {
      console.error(error)
    }
  }

  const unreadCount = insights.filter(i => !i.isRead).length

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-base">AI Business Insights</CardTitle>
              <CardDescription>Smart analytics powered by your data</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchInsights(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
            <p className="text-sm">{loadError}</p>
            <p className="text-xs mt-1">Please try refreshing again.</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BrainCircuit className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">No insights yet. Start making sales to generate AI analytics!</p>
          </div>
        ) : (
          <div className="overflow-y-auto h-[300px] pr-3 space-y-3">
            {insights.map((insight) => {
              const config = severityConfig[insight.severity]
              const Icon = config.icon
              return (
                <div
                  key={insight.id}
                  className={`relative p-3 rounded-lg border ${config.border} ${config.bg} transition-all ${
                    !insight.isRead ? 'ring-1 ring-purple-200' : 'opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{insight.title}</span>
                        <Badge variant="outline" className={`text-[10px] h-5 ${config.badge}`}>
                          {insight.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {new Date(insight.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!insight.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => markAsRead(insight.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

