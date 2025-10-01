import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    
    // Get unique customers from tickets collection
    const customers = await db
      .collection("tickets")
      .aggregate([
        {
          $group: {
            _id: "$customerEmail",
            customerName: { $first: "$customerName" },
            customerPhone: { $first: "$customerPhone" },
            customerEmail: { $first: "$customerEmail" },
            totalTickets: { $sum: 1 },
            lastVisit: { $max: "$createdAt" },
            vehicles: {
              $addToSet: {
                plateNumber: "$plateNumber",
                mileage: "$mileage"
              }
            }
          }
        },
        {
          $sort: { lastVisit: -1 }
        }
      ])
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