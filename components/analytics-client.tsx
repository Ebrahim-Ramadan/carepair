"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { AnalyticsData, AnalyticsFilter } from "@/lib/analytics"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format, parseISO, isValid } from "date-fns"
import { toast } from "sonner"
import {
  ChevronDown,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Activity,
  DollarSign,
  FileText,
  Users,
  PercentCircle,
  ShoppingBag,
  RefreshCw,
  Filter,
} from "lucide-react"

type AnalyticsClientProps = {
  initialData: AnalyticsData
}

// Color palette for charts
const COLORS = [
  "#2563eb", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", 
  "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7"
]

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [data, setData] = useState<AnalyticsData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(
    data.filters.startDate ? parseISO(data.filters.startDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    data.filters.endDate ? parseISO(data.filters.endDate) : undefined
  )

  // Fetch data with new filters
  const fetchFilteredData = async (newFilters: AnalyticsFilter) => {
    setIsLoading(true)
    
    try {
      // Create query string from filters
      const params = new URLSearchParams()
      if (newFilters.period) params.set('period', newFilters.period)
      if (newFilters.category) params.set('category', newFilters.category)
      if (newFilters.startDate) params.set('startDate', newFilters.startDate)
      if (newFilters.endDate) params.set('endDate', newFilters.endDate)
      
      // Update URL with new params
      router.push(`${pathname}?${params.toString()}`)
      
      // Fetch the data
      const response = await fetch(`/api/analytics?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch analytics data')
      
      const newData = await response.json()
      setData(newData)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to update analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle period change
  const handlePeriodChange = (value: string) => {
    // If custom is selected, show the date pickers and wait for the user to apply
    if (value === 'custom') {
      setData(prev => ({ ...prev, filters: { ...prev.filters, period: 'custom' } }))
      return
    }

    // Clear local custom date inputs when switching to a predefined period
    setStartDate(undefined)
    setEndDate(undefined)

    fetchFilteredData({
      period: value,
      category: data.filters.category,
      // Clear date range when selecting a predefined period
      startDate: undefined,
      endDate: undefined
    })
  }

  // Handle category change
  const handleCategoryChange = (value: string) => {
    fetchFilteredData({
      period: data.filters.period,
      category: value,
      startDate: data.filters.startDate,
      endDate: data.filters.endDate
    })
  }

  // Handle custom date range
  const handleDateRangeApply = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }
    
    if (startDate > endDate) {
      toast.error('Start date must be before end date')
      return
    }
    
    fetchFilteredData({
      period: 'custom',
      category: data.filters.category,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    })
  }

  // Reset filters
  const handleResetFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    
    fetchFilteredData({
      period: 'month',
      category: 'all',
      startDate: undefined,
      endDate: undefined
    })
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Sales</h1>
          <p className="text-sm text-muted-foreground">
            Track performance metrics and insights for your repair business
          </p>
          
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Period filter */}
          <div className="flex items-center">
            <Select 
              defaultValue={data.filters.period || 'month'} 
              onValueChange={handlePeriodChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Time Period</SelectLabel>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last 12 Months</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Category filter */}
          <div className="flex items-center">
            <Select 
              defaultValue={data.filters.category || 'all'} 
              onValueChange={handleCategoryChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Service Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Service Category</SelectLabel>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="protection">Protection</SelectItem>
                  <SelectItem value="tanting">Tanting</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="detailing">Detailing</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Custom date range */}
          {data.filters.period === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                disabled={isLoading}
                placeholder="Start date"
              />
              <span className="text-muted-foreground">to</span>
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                disabled={isLoading}
                placeholder="End date"
              />
              <Button 
                size="sm" 
                onClick={handleDateRangeApply}
                disabled={isLoading || !startDate || !endDate}
              >
                Apply
              </Button>
            </div>
          )}
          
          {/* Reset filters */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleResetFilters}
            disabled={isLoading}
            title="Reset filters"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Revenue</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                For the selected period
              </p>
            </div>
          </div>
          
          <div>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Ticket Count</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data.totalTickets}</div>
              <p className="text-xs text-muted-foreground">
                Total jobs processed
              </p>
            </div>
          </div>
          
          <div>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Avg. Ticket Value</div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(data.averageTicketValue)}</div>
              <p className="text-xs text-muted-foreground">
                Average revenue per job
              </p>
            </div>
          </div>
          
          <div>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Service Categories</div>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data.serviceCategories.length}</div>
              <p className="text-xs text-muted-foreground">
                Active service types
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Detail Data */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Revenue Trend */}
          <div className="col-span-full">
            <div>
              <div>Revenue Trend</div>
              <p className="text-sm text-muted-foreground">Daily revenue performance over time</p>
            </div>
            <div className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.revenueByDay}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const parsedDate = parseISO(date)
                        return isValid(parsedDate) ? format(parsedDate, 'MMM dd') : date
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue') return formatCurrency(value as number)
                        return value
                      }}
                      labelFormatter={(date) => {
                        const parsedDate = parseISO(date as string)
                        return isValid(parsedDate) ? format(parsedDate, 'MMMM d, yyyy') : date
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke="#2563eb" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ticketCount" 
                      name="Tickets" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Service Categories */}
          <div>
            <div>
              <div>Service Categories</div>
              <p className="text-sm text-muted-foreground">Revenue by service category</p>
            </div>
            <div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.serviceCategories}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#2563eb" 
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Top Services */}
          <div>
            <div>
              <div>Top Services</div>
              <p className="text-sm text-muted-foreground">Most popular services by count</p>
            </div>
            <div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.topServices.slice(0, 5)}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="serviceName" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={150}
                    />
                    <Tooltip 
                      formatter={(value) => value}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8b5cf6" 
                      name="Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Common Repair Parts */}
          <div>
            <div>
              <div>Common Repair Parts</div>
              <p className="text-sm text-muted-foreground">Most frequently repaired vehicle parts</p>
            </div>
            <div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.commonRepairParts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${formatPercentage(percent * 100)}`}
                    >
                      {data.commonRepairParts.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [value, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Data Tables */}
      {!isLoading && (
        <Tabs defaultValue="services" className="w-full">
           <div className="overflow-x-auto pb-2">
    <TabsList className="w-full min-w-[500px]">
      <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
      <TabsTrigger value="categories" className="flex-1">Categories</TabsTrigger>
      <TabsTrigger value="daily" className="flex-1">Daily Data</TabsTrigger>
    </TabsList>
  </div>
          
          <TabsContent value="services" className="space-y-4">
            <div>
              <div>
                <div>Service Performance</div>
                <p className="text-sm text-muted-foreground">
                  Detailed breakdown of each service's performance
                </p>
              </div>
              <div>
                <div className="rounded-md border">
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b bg-muted/50">
                          <th className="p-3 font-medium">Service Name</th>
                          <th className="p-3 font-medium">Category</th>
                          <th className="p-3 font-medium text-right">Count</th>
                          <th className="p-3 font-medium text-right">Revenue</th>
                          <th className="p-3 font-medium text-right">Avg. Price</th>
                          <th className="p-3 font-medium text-right">Cost</th>
                          <th className="p-3 font-medium text-right">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topServices.map((service) => {
                          const revenue = typeof service.revenue === "number" ? service.revenue : Number(service.revenue ?? 0)
                          const count = typeof service.count === "number" && service.count > 0 ? service.count : 1
                          const avgPrice = count ? revenue / count : 0

                          // cost can be provided per-service in the analytics payload (total cost for that service)
                          // fallback to 0 when missing
                          const cost = typeof service.cost === "number" ? service.cost : Number(service.cost ?? 0)

                          // net profit = revenue - cost
                          const netProfit = revenue - cost

                          return (
                            <tr key={service.serviceId} className="border-b hover:bg-muted/50">
                              <td className="p-3">{service.serviceName}</td>
                              <td className="p-3 capitalize">{service.categoryId}</td>
                              <td className="p-3 text-right">{service.count}</td>
                              <td className="p-3 text-right">{formatCurrency(revenue)}</td>
                              <td className="p-3 text-right">{formatCurrency(avgPrice)}</td>
                              <td className="p-3 text-right text-muted-foreground">{formatCurrency(cost)}</td>
                              <td className={`p-3 text-right ${netProfit < 0 ? 'text-rose-600' : 'text-green-600'}`}>
                                {formatCurrency(netProfit)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <div>
              <div>
                <div>Category Performance</div>
                <p className="text-sm text-muted-foreground">
                  Revenue and ticket count by service category
                </p>
              </div>
              <div>
                <div className="rounded-md border">
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b bg-muted/50">
                          <th className="p-3 font-medium">Category</th>
                          <th className="p-3 font-medium text-right">Services</th>
                          <th className="p-3 font-medium text-right">Revenue</th>
                          <th className="p-3 font-medium text-right">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.serviceCategories.map((category) => (
                          <tr key={category.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 capitalize">{category.name}</td>
                            <td className="p-3 text-right">{category.count}</td>
                            <td className="p-3 text-right">{formatCurrency(category.revenue)}</td>
                            <td className="p-3 text-right">
                              {formatPercentage((category.revenue / data.totalRevenue) * 100)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          
          <TabsContent value="daily" className="space-y-4">
            <div>
              <div>
                <div>Daily Revenue</div>
                <p className="text-sm text-muted-foreground">
                  Day-by-day breakdown of revenue and tickets
                </p>
              </div>
              <div>
                <div className="rounded-md border">
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b bg-muted/50">
                          <th className="p-3 font-medium">Date</th>
                          <th className="p-3 font-medium text-right">Tickets</th>
                          <th className="p-3 font-medium text-right">Revenue</th>
                          <th className="p-3 font-medium text-right">Avg. Ticket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.revenueByDay.map((day) => (
                          <tr key={day.date} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              {format(parseISO(day.date), 'MMM d, yyyy')}
                            </td>
                            <td className="p-3 text-right">{day.ticketCount}</td>
                            <td className="p-3 text-right">{formatCurrency(day.revenue)}</td>
                            <td className="p-3 text-right">
                              {formatCurrency(day.revenue / day.ticketCount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}