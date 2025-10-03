/* eslint-disable */
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { serviceId, serviceName, serviceNameAr, price, category, addedAt } = await request.json()

    if (!serviceId || !serviceName || !price) {
      return NextResponse.json(
        { error: 'Service information is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("car_repair")
    const objectId = new ObjectId(id)

    // Get the current ticket to calculate the new total amount
    const currentTicket = await db.collection('tickets').findOne({ _id: objectId })
    
    if (!currentTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Calculate new total amount
    const currentTotal = currentTicket.totalAmount || 0
    const servicePrice = typeof price === 'number' ? price : 0
    const newTotal = currentTotal + servicePrice

    // Add the service to the ticket - use type assertion to bypass TypeScript's strict checking
    const result = await db.collection('tickets').findOneAndUpdate(
      { _id: objectId },
      { 
        $push: { 
          services: {
            serviceId,
            serviceName,
            serviceNameAr,
            price,
            category,
            addedAt
          } 
        } as any,  // Type assertion to fix TypeScript error
        $set: { 
          totalAmount: newTotal,
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to add service to ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error adding service to ticket:', error)
    return NextResponse.json(
      { error: 'Failed to add service to ticket' },
      { status: 500 }
    )
  }
}

// Also add an endpoint to retrieve all services
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("car_repair")
    const objectId = new ObjectId(id)
    
    // Get the ticket with services
    const ticket = await db.collection('tickets').findOne(
      { _id: objectId },
      { projection: { services: 1 } }
    )
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ services: ticket.services || [] })
  } catch (error) {
    console.error('Error retrieving services:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve services' },
      { status: 500 }
    )
  }
}