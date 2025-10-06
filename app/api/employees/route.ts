import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { revalidatePath } from "next/cache"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const employees = await db.collection("employees")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const result = await db.collection("employees").insertOne({
      ...body,
      createdAt: new Date(body.createdAt)
    })

    const newEmployee = await db.collection("employees").findOne({
      _id: result.insertedId
    })

    // Revalidate the HR Department page
    revalidatePath('/HRDepartment')

    return NextResponse.json(newEmployee)
  } catch (error) {
    console.error('Error adding employee:', error)
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 }
    )
  }
}