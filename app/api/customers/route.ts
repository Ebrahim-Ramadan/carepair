import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const period = url.searchParams.get('period')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const client = await clientPromise
    const db = client.db("car_repair")
    
    // Build date filter
    let dateFilter: any = {}
    if ((period && period !== 'all') || (startDate && endDate)) {
      const now = new Date()
      let start: Date | null = null

      if (period === '7days') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        start.setHours(0, 0, 0, 0)
        dateFilter = {
          $or: [
            { createdAt: { $gte: start, $lte: now } },
            { createdAt: { $gte: start.toISOString(), $lte: now.toISOString() } }
          ]
        }
      } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        start.setHours(0, 0, 0, 0)
        dateFilter = {
          $or: [
            { createdAt: { $gte: start, $lte: now } },
            { createdAt: { $gte: start.toISOString(), $lte: now.toISOString() } }
          ]
        }
      } else if (period === 'year') {
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        start.setHours(0, 0, 0, 0)
        dateFilter = {
          $or: [
            { createdAt: { $gte: start, $lte: now } },
            { createdAt: { $gte: start.toISOString(), $lte: now.toISOString() } }
          ]
        }
      } else if (period === 'custom' && startDate && endDate) {
        const customStart = new Date(startDate)
        const customEnd = new Date(endDate)
        customStart.setHours(0, 0, 0, 0)
        customEnd.setHours(23, 59, 59, 999)
        dateFilter = {
          $or: [
            { createdAt: { $gte: customStart, $lte: customEnd } },
            { createdAt: { $gte: customStart.toISOString(), $lte: customEnd.toISOString() } }
          ]
        }
      }
    }

    // Build category filter - filter tickets that have at least one service with the specified category
    let categoryFilter: any = {}
    if (category && category !== 'all') {
      categoryFilter = {
        "services.category": category
      }
    }

    // Combine filters
    const matchFilter: any = {}
    if (Object.keys(dateFilter).length > 0 || Object.keys(categoryFilter).length > 0) {
      matchFilter.$and = []
      if (Object.keys(dateFilter).length > 0) {
        matchFilter.$and.push(dateFilter)
      }
      if (Object.keys(categoryFilter).length > 0) {
        matchFilter.$and.push(categoryFilter)
      }
    }

    // Build aggregation pipeline
    const pipeline: any[] = []
    
    // Add match stage if filters exist
    if (Object.keys(matchFilter).length > 0) {
      pipeline.push({ $match: matchFilter })
    }

    // Group by customer
    pipeline.push({
      $group: {
        // Group by combination of name and phone (more reliable than email which may be empty)
        _id: {
          name: "$customerName",
          phone: "$customerPhone"
        },
        customerName: { $first: "$customerName" },
        customerPhone: { $first: "$customerPhone" },
        customerEmail: { $first: "$customerEmail" },
        totalTickets: { $sum: 1 },
        lastVisit: { $max: "$createdAt" },
        vehicles: {
          $addToSet: {
            plateNumber: "$plateNumber",
            ticketId: "$_id"
          }
        }
      }
    })

    // Sort by last visit
    pipeline.push({
      $sort: { lastVisit: -1 }
    })

    // Get unique customers from tickets collection
    const customers = await db
      .collection("tickets")
      .aggregate(pipeline)
      .toArray()

    // Create response with cache control headers
    const response = NextResponse.json(customers)
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json(
      { message: "Failed to fetch customers" }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    )
  }
}