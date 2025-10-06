import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")

    // Get the ticket and service to calculate correct total
    const ticket = await db.collection("tickets").findOne(
      { _id: new ObjectId(params.id) }
    )

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Find the service to be removed to subtract its price from total
    const serviceToRemove = ticket.services.find(
      (s: any) => s.serviceId === params.serviceId
    )

    if (!serviceToRemove) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const result = await db.collection("tickets").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { 
        $pull: { 
          services: { serviceId: params.serviceId } 
        },
        // Update total amount by subtracting the removed service's price
        $set: {
          totalAmount: (ticket.totalAmount || 0) - (serviceToRemove.finalPrice || serviceToRemove.price)
        }
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error removing service:', error)
    return NextResponse.json(
      { error: 'Failed to remove service' },
      { status: 500 }
    )
  }
}