import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    console.log('API: Received request with searchParams:', searchParams)
    
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const sortBy = searchParams.get("sortBy") || "latest" // latest or earliest

    // Validate pagination parameters
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 50) // Max 50 per page
    const skip = (validatedPage - 1) * validatedLimit

    // Determine sort order
    const sortOrder = sortBy === "earliest" ? 1 : -1

    const client = await clientPromise
    console.log('API: MongoDB connected')
    
    const db = client.db("car_repair")
    const collection = db.collection("appointments")

    // Log counts for debugging
    const totalCount = await collection.countDocuments({})
    console.log('API: Total appointments:', totalCount)

    // Get total count for pagination
    const totalPages = Math.ceil(totalCount / validatedLimit)

    // Get paginated and sorted results
    const appointments = await collection
      .find({})
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(validatedLimit)
      .toArray()

    const response = NextResponse.json({
      appointments,
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalCount,
        limit: validatedLimit,
        hasNext: validatedPage < totalPages,
        hasPrevious: validatedPage > 1
      },
      sortBy
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })

    return response
  } catch (error) {
    console.error("Detailed API error:", error)
    return NextResponse.json(
      { 
        message: "Failed to fetch appointments",
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}