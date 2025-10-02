import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, serviceId: string } }
) {
  try {
    const { id, serviceId } = params
    
    if (!id || !serviceId) {
      return NextResponse.json(
        { error: 'Ticket ID and service ID are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("car_repair")
    const objectId = new ObjectId(id)

    // Get the current ticket to find the service and its price
    const currentTicket = await db.collection('tickets').findOne({ _id: objectId })
    
    if (!currentTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Find the service to be removed to get its price
    const serviceToRemove = currentTicket.services?.find(
      (service: any) => service.serviceId === serviceId
    )

    if (!serviceToRemove) {
      return NextResponse.json(
        { error: 'Service not found in ticket' },
        { status: 404 }
      )
    }

    // Calculate new total amount
    const currentTotal = currentTicket.totalAmount || 0
    const servicePrice = typeof serviceToRemove.price === 'number' ? serviceToRemove.price : 0
    const newTotal = currentTotal - servicePrice

    // Remove the service from the ticket
    const result = await db.collection('tickets').findOneAndUpdate(
      { _id: objectId },
      { 
        $pull: { 
          services: { serviceId: serviceId } 
        },
        $set: { 
          totalAmount: newTotal,
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to remove service from ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error removing service from ticket:', error)
    return NextResponse.json(
      { error: 'Failed to remove service from ticket' },
      { status: 500 }
    )
  }
}