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

    // Add the service to the ticket
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
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    // Delete this service from the ticket
    const result = await db.collection('tickets').findOneAndUpdate(
      { _id: objectId, "services.serviceId": serviceId },
      { 
        $pull: { 
          services: { serviceId } 
        },
        $set: { 
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: 'after' }
    )

    // Recalculate the total amount
    let newTotal = 0
    if (result.services) {
      newTotal = result.services.reduce((sum, service) => {
        const price = typeof service.price === 'number' ? service.price : 0
        return sum + price
      }, 0)
    }

    // Update the total amount
    const updatedTicket = await db.collection('tickets').findOneAndUpdate(
      { _id: objectId },
      { 
        $set: { 
          totalAmount: newTotal,
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error('Error removing service from ticket:', error)
    return NextResponse.json(
      { error: 'Failed to remove service from ticket' },
      { status: 500 }
    )
  }
}