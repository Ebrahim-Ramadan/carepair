import clientPromise from "@/lib/mongodb"
import { subDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns"

export type AnalyticsFilter = {
  period?: string
  category?: string
  startDate?: string
  endDate?: string
}

export type ServiceCategory = {
  id: string
  name: string
  count: number
  revenue: number
}

export type RevenueByDay = {
  date: string
  revenue: number
  ticketCount: number
}

export type ServicePopularity = {
  serviceId: string
  serviceName: string
  count: number
  revenue: number
  categoryId: string
  cost?: number
}

export type RepairPartData = {
  name: string
  count: number
  percentage: number
}

export type AnalyticsData = {
  totalRevenue: number
  totalTickets: number
  averageTicketValue: number
  serviceCategories: ServiceCategory[]
  revenueByDay: RevenueByDay[]
  topServices: ServicePopularity[]
  commonRepairParts: RepairPartData[]
  period: string
  filters: AnalyticsFilter
}

export async function getAnalyticsData({
  period = 'all',
  category = 'all',
  startDate,
  endDate
}: AnalyticsFilter): Promise<AnalyticsData> {
  const client = await clientPromise
  const db = client.db("car_repair")
  const collection = db.collection("tickets")
  
  // Calculate date range based on period
  let dateFilter: any = {}
  const now = new Date()
  
  if (startDate && endDate) {
    // Custom date range
    // Interpret start/end and include the full end day
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Support documents where `createdAt` may be stored as a Date OR as an ISO string
    dateFilter = {
      $or: [
        { createdAt: { $gte: start, $lte: end } },
        { createdAt: { $gte: start.toISOString(), $lte: end.toISOString() } }
      ]
    }
  } else {
    // Predefined periods
    switch(period) {
      case 'week':
        dateFilter = { 
          createdAt: { $gte: subDays(now, 7) } 
        }
        break
      case 'month':
        dateFilter = { 
          createdAt: { $gte: subDays(now, 30) } 
        }
        break
      case 'quarter':
        dateFilter = { 
          createdAt: { $gte: subDays(now, 90) } 
        }
        break
      case 'year':
        dateFilter = { 
          createdAt: { $gte: subMonths(now, 12) } 
        }
        break
      case 'all':
      default:
        // No date filter - get all tickets
        dateFilter = {}
        break
    }
  }
  
  // Category filter
  let categoryFilter = {}
  if (category !== 'all') {
    categoryFilter = { "services.category": category }
  }
  
  // Combine filters
  const filter = {
    ...dateFilter,
    ...categoryFilter
  }
  
  // Get all tickets matching the filter
  const tickets = await collection.find(filter).toArray()
  
  console.log('Analytics filter:', filter)
  console.log('Tickets found:', tickets.length)
  if (tickets.length > 0) {
    console.log('First ticket:', tickets[0])
  }
  
  // Calculate total revenue
  const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0)
  
  // Count total tickets
  const totalTickets = tickets.length
  
  // Calculate average ticket value
  const averageTicketValue = totalTickets > 0 ? totalRevenue / totalTickets : 0
  
  // Calculate revenue by service category
  const categoryMap = new Map<string, ServiceCategory>()
  
  // Track service popularity
  const serviceMap = new Map<string, ServicePopularity>()
  
  // Track repair parts
  const repairPartsMap = new Map<string, number>()
  let totalRepairPartsMentions = 0
  
  // Track revenue by day
  const revenueByDayMap = new Map<string, { revenue: number, count: number }>()
  
  // Process each ticket
  tickets.forEach(ticket => {
    // Track services and categories
    if (ticket.services && Array.isArray(ticket.services)) {
      ticket.services.forEach(service => {
        // Track service categories
        if (!categoryMap.has(service.category)) {
          categoryMap.set(service.category, {
            id: service.category,
            name: service.category,
            count: 0,
            revenue: 0
          })
        }
        
        const categoryData = categoryMap.get(service.category)!
        categoryData.count++
        categoryData.revenue += service.price || 0
        
        // Track individual services
        if (!serviceMap.has(service.serviceId)) {
          serviceMap.set(service.serviceId, {
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            count: 0,
            revenue: 0,
            categoryId: service.category
          })
        }
        
        const serviceData = serviceMap.get(service.serviceId)!
        serviceData.count++
        serviceData.revenue += service.price || 0
      })
    }
    
    // Track repair parts
    if (ticket.repairParts && Array.isArray(ticket.repairParts)) {
      ticket.repairParts.forEach(part => {
        repairPartsMap.set(part, (repairPartsMap.get(part) || 0) + 1)
        totalRepairPartsMentions++
      })
    }
    
    // Track revenue by day
    const createdDate = new Date(ticket.createdAt)
    const dateString = format(createdDate, 'yyyy-MM-dd')
    
    if (!revenueByDayMap.has(dateString)) {
      revenueByDayMap.set(dateString, { revenue: 0, count: 0 })
    }
    
    const dayData = revenueByDayMap.get(dateString)!
    dayData.revenue += ticket.totalAmount || 0
    dayData.count++
  })
  
  // Convert maps to arrays
  const serviceCategories = Array.from(categoryMap.values())
  
  const topServices = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  const commonRepairParts = Array.from(repairPartsMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalRepairPartsMentions > 0 
        ? (count / totalRepairPartsMentions) * 100 
        : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Convert revenue by day to sorted array
  const revenueByDay = Array.from(revenueByDayMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      ticketCount: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    totalRevenue,
    totalTickets,
    averageTicketValue,
    serviceCategories,
    revenueByDay,
    topServices,
    commonRepairParts,
    period,
    filters: { period, category, startDate, endDate }
  }
}