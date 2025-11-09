// app/api/employees/[id]/route.ts
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const body = await request.json()
    const { name, jobTitle, salary, absenceDays, workingDays } = body

    const result = await db.collection("employees").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          name, 
          jobTitle, 
          salary: Number(salary),
          absenceDays: Number(absenceDays) || 0,
          workingDays: Number(workingDays) || 30,
          updatedAt: new Date().toISOString()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Fetch the updated employee
    const updatedEmployee = await db.collection("employees").findOne({
      _id: new ObjectId(params.id)
    })

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const result = await db.collection("employees").deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}