import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const services = await db.collection("services")
      .find({})
      .sort({ category: 1, nameEn: 1 })
      .toArray()

    return NextResponse.json(services)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const result = await db.collection("services").insertOne(body)
    
    return NextResponse.json({ 
      _id: result.insertedId,
      ...body 
    })
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}