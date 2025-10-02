import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
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
    const db = client.db("car_repair")
    const collection = db.collection("appointments")

    // Get total count for pagination
    const totalCount = await collection.countDocuments({})
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
    })
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { message: "Failed to fetch appointments" }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    )
  }
}