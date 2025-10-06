/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("car_repair")
    
    // Get current ticket to calculate new total
    const ticket = await db.collection("tickets").findOne(
      { _id: new ObjectId(params.id) }
    )
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    const result = await db.collection("tickets").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { 
        $push: { 
          services: {
            ...body,
            addedAt: new Date(body.addedAt)
          }
        },
        // Update total amount with the new service's final price
        $set: {
          totalAmount: (ticket.totalAmount || 0) + (body.finalPrice || body.price)
        }
      },
      { returnDocument: 'after' }
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error adding service:', error)
    return NextResponse.json(
      { error: 'Failed to add service' },
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