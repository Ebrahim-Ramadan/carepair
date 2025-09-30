import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { CreateTicketInput } from "@/lib/types"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    const tickets = await db.collection("tickets").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
