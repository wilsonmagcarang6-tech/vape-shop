"use client"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import {
  Users,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  DollarSign,
  ShoppingBag,
  Zap,
  Package,
  AlertTriangle,
  Calendar,
} from "lucide-react"

interface TopProduct {
  productId: number
  productName: string
  quantity: number
  revenue: number
}

interface DailyStat {
  date: string
  sales: number
  profit: number
  transactions: number
  itemsSold: number
}

interface StaffMember {
  staffId: number
  staffName: string
  staffType: "cashier" | "admin"
  totalSales: number
  totalProfit: number
  transactionCount: number
  itemsSold: number
  averageTransactionValue: number
  averageItemsPerTransaction: number
  salesPerActiveHour: number
  lowStockSales: number
  lowStockIncidentRate: number
  efficiencyScore: number
  trend: "rising" | "falling" | "stable"
  trendPercent: number
  dailyStats: DailyStat[]
  topProducts: TopProduct[]
}

interface OverallSummary {
  totalStaffSales: number
  totalStaffProfit: number
  totalTransactions: number
  topPerformer: StaffMember | null
  bestAtv: StaffMember | null
  mostEfficient: StaffMember | null
  cashierOverall?: {
    totalSales: number
    totalProfit: number
    totalTransactions: number
    topPerformer: StaffMember | null
  } | null
  adminOverall?: {
    totalSales: number
    totalProfit: number
    totalTransactions: number
    topPerformer: StaffMember | null
  } | null
}


export function AiStaffPerformance() {
  const [staffData, setStaffData] = useState<StaffMember[]>([])
  const [overall, setOverall] = useState<OverallSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setRefreshing(true)
      let url = '/api/ai/staff-performance?days=30'
      if (fromDate && toDate) {
        url = `/api/ai/staff-performance?from=${fromDate}&to=${toDate}`
      }
      const res = await fetch(url)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setAccessDenied(true)
          setStaffData([])
          setOverall(null)
          setSelectedStaff(null)
          return
        }
        const message = json?.error || json?.message || 'Failed to fetch staff performance'
        toast.error(message)
        setStaffData([])
        setOverall(null)
        setSelectedStaff(null)
        return
      }
      setAccessDenied(false)
      setStaffData(json.data?.staff || [])
      setOverall(json.data?.overall || null)
      if (json.data?.staff?.length > 0) {
        setSelectedStaff((current) => current ?? json.data.staff[0])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load staff performance data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    void fetchData()
  }, [fetchData])
  const handleDateFilter = () => {
    if (fromDate && toDate) {
      fetchData()
    }
  }

  const trendIcon = (trend: string) => {
    if (trend === "rising") return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === "falling") return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const trendColor = (trend: string) => {
    if (trend === "rising") return "text-green-600"
    if (trend === "falling") return "text-red-600"
    return "text-muted-foreground"
  }

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <div>
            <h2 className="text-lg font-semibold">Staff Performance Analytics</h2>
            <p className="text-sm text-muted-foreground">Sales, efficiency & inventory accuracy per staff</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <Button size="sm" variant="outline" onClick={handleDateFilter} disabled={!fromDate || !toDate} className="h-8 text-xs">
              Filter
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setFromDate("")
              setToDate("")
              fetchData()
            }}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : overall ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Combined Total */}
          <Card className="border-l-4 border-l-purple-500 md:col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Combined Sales</p>
                  <p className="text-2xl font-bold mt-1">₱{overall.totalStaffSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cashier Sales */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Cashier Sales</p>
                  <p className="text-xl font-bold mt-1">
                    ₱{(overall.cashierOverall?.totalSales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Sales */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Admin Sales</p>
                  <p className="text-xl font-bold mt-1">
                    ₱{(overall.adminOverall?.totalSales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="border-l-4 border-l-amber-500 lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Cashier</p>
                  <p className="text-sm font-bold mt-1 truncate max-w-[120px]">{overall.cashierOverall?.topPerformer?.staffName || "N/A"}</p>
                  <p className="text-xs text-emerald-600">
                    ₱{(overall.cashierOverall?.topPerformer?.totalSales || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Admin</p>
                  <p className="text-sm font-bold truncate max-w-[120px]">{overall.adminOverall?.topPerformer?.staffName || "N/A"}</p>
                  <p className="text-xs text-blue-600">
                    ₱{(overall.adminOverall?.topPerformer?.totalSales || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}


      {loading ? (
        <Skeleton className="h-[400px] w-full rounded-lg" />
      ) : accessDenied ? (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
          <p className="text-sm font-medium">Access denied</p>
          <p className="text-xs mt-1">Only admin accounts can view staff performance analytics.</p>
        </div>
      ) : staffData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm">No staff sales data found for this period.</p>
          <p className="text-xs mt-1">Staff sales are tracked automatically when cashiers or admins process orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Staff Leaderboard</CardTitle>
              <CardDescription>Ranked by total sales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {staffData.map((staff, index) => (
                <button
                  key={`${staff.staffType}-${staff.staffId}`}
                  onClick={() => setSelectedStaff(staff)}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                    selectedStaff?.staffId === staff.staffId && selectedStaff?.staffType === staff.staffType
                      ? 'border-purple-300 bg-purple-50 ring-1 ring-purple-200'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">{staff.staffName}</span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {staff.staffType}
                      </Badge>
                    </div>
                    {trendIcon(staff.trend)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sales</span>
                      <span className="font-semibold">₱{staff.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">ATV</span>
                      <span className="font-semibold">₱{staff.averageTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-muted-foreground">Efficiency</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getEfficiencyColor(staff.efficiencyScore)}`}
                            style={{ width: `${staff.efficiencyScore}%` }}
                          />
                        </div>
                        <span className="font-semibold text-xs">{staff.efficiencyScore}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Selected Staff Detail */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStaff && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {selectedStaff.staffName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-base">{selectedStaff.staffName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{selectedStaff.staffType}</Badge>
                            <span className={`flex items-center gap-1 text-xs ${trendColor(selectedStaff.trend)}`}>
                              {trendIcon(selectedStaff.trend)}
                              {selectedStaff.trendPercent > 0 ? '+' : ''}{selectedStaff.trendPercent}% trend
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">Total Sales</p>
                        <p className="text-lg font-bold">₱{selectedStaff.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">Profit</p>
                        <p className="text-lg font-bold text-emerald-600">₱{selectedStaff.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">Transactions</p>
                        <p className="text-lg font-bold">{selectedStaff.transactionCount}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">Items Sold</p>
                        <p className="text-lg font-bold">{selectedStaff.itemsSold}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">ATV</p>
                        <p className="text-lg font-bold">₱{selectedStaff.averageTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">Sales/Hour</p>
                        <p className="text-lg font-bold">₱{selectedStaff.salesPerActiveHour.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">Items/Txn</p>
                        <p className="text-lg font-bold">{selectedStaff.averageItemsPerTransaction.toFixed(1)}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase">Low Stock Incidents</p>
                        <p className={`text-lg font-bold ${selectedStaff.lowStockSales > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedStaff.lowStockSales}
                        </p>
                      </div>
                    </div>

                    {/* Daily Sales Trend Chart */}
                    {selectedStaff.dailyStats.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold mb-3">Daily Sales Trend</p>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={selectedStaff.dailyStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                              dataKey="date"
      tickFormatter={(value: string): string => {
                                const d = new Date(value)
                                return `${d.getMonth() + 1}/${d.getDate()}`
                              }}
                              tick={{ fontSize: 10 }}
                              minTickGap={30}
                            />
                            <YAxis
                              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip
                              formatter={(value, name) => [
                                `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
                                name,
                              ]}
                              labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Sales" />
                            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Profit" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Top Products */}
                    {selectedStaff.topProducts.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-3">Top Products Sold</p>
                        <div className="space-y-2">
                          {selectedStaff.topProducts.map((product) => (
                            <div key={product.productId} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">{product.productName}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-muted-foreground">{product.quantity} units</span>
                                <span className="font-semibold">₱{product.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Revenue Comparison Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Revenue Comparison</CardTitle>
                <CardDescription>Total sales per staff member</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={staffData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="staffName" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [`₱${Number(value).toLocaleString()}`, "Total Sales"]}
                    />
                    <Bar dataKey="totalSales" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Efficiency vs Low Stock Incidents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Efficiency & Accuracy</CardTitle>
                <CardDescription>Efficiency score vs low-stock incident rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staffData.map((staff) => (
                    <div key={`${staff.staffType}-${staff.staffId}`} className="flex items-center gap-4">
                      <div className="w-24 truncate text-xs font-medium">{staff.staffName}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getEfficiencyColor(staff.efficiencyScore)}`}
                            style={{ width: `${staff.efficiencyScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8">{staff.efficiencyScore}</span>
                      </div>
                      <div className="flex items-center gap-1 w-24 justify-end">
                        {staff.lowStockSales > 0 ? (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        ) : (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                        <span className={`text-xs ${staff.lowStockSales > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {staff.lowStockSales} incidents
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

