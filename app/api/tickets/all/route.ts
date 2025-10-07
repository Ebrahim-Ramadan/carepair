import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")

    const tickets = await db
      .collection("tickets")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    // Serialize ObjectIds and Dates
    return NextResponse.json(JSON.parse(JSON.stringify(tickets)))
  } catch (error) {
    console.error("Error fetching all tickets:", error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}