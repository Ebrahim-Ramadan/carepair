import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const employees = await db.collection("employees")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(
      JSON.parse(JSON.stringify(employees))
    )
  } catch (error) {
    console.error('Error fetching all employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}