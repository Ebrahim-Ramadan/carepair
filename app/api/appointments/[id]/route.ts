import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()
    
    // Validate status
    const validStatuses = ["pending", "confirmed", "completed", "canceled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status" }, 
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("car_repair")
    
    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Appointment not found" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: "Appointment status updated successfully",
      status 
    })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json(
      { message: "Failed to update appointment" }, 
      { status: 500 }
    )
  }
}