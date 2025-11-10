import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { CreateTicketInput } from "@/lib/types"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const pageSize = 10
    const skip = (page - 1) * pageSize

    const client = await clientPromise
    const db = client.db("car_repair")

    const [tickets, total] = await Promise.all([
      db
        .collection("tickets")
        .find({}, { projection: { _id: 1, plateNumber: 1, customerName: 1, createdAt: 1, isCheckup: 1 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      db.collection("tickets").countDocuments({}),
    ])

    const plainTickets = tickets.map((t: any) => ({
      _id: t._id?.toString(),
      plateNumber: t.plateNumber,
      customerName: t.customerName,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date(0).toISOString(),
      isCheckup: t.isCheckup || false,
    }))

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const response = NextResponse.json({
      tickets: plainTickets,
      page,
      totalPages,
      total
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { message: "Failed to fetch tickets" },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {

    const session = request.cookies.get("session")?.value
    let role = ""
    if (session) {
      try {
        const parsed = JSON.parse(session)
        role = parsed.role
      } catch {}
    }
    if ( role === "readonly") {
      return NextResponse.json({ error: "Forbidden for this role" }, { status: 403 })
    }

    const body: CreateTicketInput = await request.json()

    // Validate required fields
    if (!body.plateNumber || !body.customerName || !body.customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("car_repair")

    const ticket = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tickets").insertOne(ticket)

    return NextResponse.json({ ...ticket, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
