import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Validate pagination parameters
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 50) // Max 50 per page
    const skip = (validatedPage - 1) * validatedLimit

    const client = await clientPromise
    const db = client.db("car_repair")
    const collection = db.collection("tickets")

    const searchTerm = query.trim()
    
    // Create search conditions for different fields
    const searchConditions = [
      // Search by plate number
      { plateNumber: { $regex: searchTerm, $options: "i" } },
      
      // Search by customer name
      { customerName: { $regex: searchTerm, $options: "i" } },
      
      // Search by customer phone
      { customerPhone: { $regex: searchTerm, $options: "i" } },
      
      // Search by customer email
      { customerEmail: { $regex: searchTerm, $options: "i" } },
    ]

    // If search term looks like an ObjectId (24 hex characters), search by exact ID
    if (/^[0-9a-fA-F]{24}$/.test(searchTerm)) {
      try {
        searchConditions.unshift({ _id: new ObjectId(searchTerm) })
      } catch (e) {
        // Invalid ObjectId, ignore
      }
    }

    // If search term looks like a partial ObjectId (6+ hex characters), search by ID as string
    if (/^[0-9a-fA-F]{6,}$/.test(searchTerm)) {
      searchConditions.unshift({ 
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: searchTerm,
            options: "i"
          }
        }
      })
    }

    const searchQuery = { $or: searchConditions }

    // Get total count for pagination
    const totalCount = await collection.countDocuments(searchQuery)
    const totalPages = Math.ceil(totalCount / validatedLimit)

    // Get paginated results
    const tickets = await collection
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .toArray()

    return NextResponse.json({
      tickets,
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalCount,
        limit: validatedLimit,
        hasNext: validatedPage < totalPages,
        hasPrevious: validatedPage > 1
      },
      query: searchTerm
    })

  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search tickets" },
      { status: 500 }
    )
  }
}