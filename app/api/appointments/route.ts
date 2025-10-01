import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    const appointments = await db
      .collection("appointments")
      .find({})
      // .find({}, { projection: { _id: 1, customer: 1, vehicle: 1, service: 1, status: 1, createdAt: 1, updatedAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ message: "Failed to fetch appointments" }, { status: 500 })
  }
}



