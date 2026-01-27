import {  NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")

    const identifier = params.serviceId
    if (!identifier || identifier === 'undefined') {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const addedAt = url.searchParams.get('addedAt')

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

    // Locate the specific service instance (support multiple same IDs)
    const matchByIdOrName = (s: any) =>
      (s.serviceId?.toString() === identifier) || (s.serviceName === identifier)
    const index = ticket.services.findIndex((s: any) =>
      matchByIdOrName(s) && (!addedAt || s.addedAt === addedAt)
    )
    const serviceToRemove = index >= 0 ? ticket.services[index] : undefined

    if (!serviceToRemove) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Build new services array removing only the matched instance
    const remainingServices = [...(ticket.services || [])]
    if (index >= 0) remainingServices.splice(index, 1)
    const removedPrice = serviceToRemove.finalPrice || serviceToRemove.price || 0
    const newTotal = Math.max(0, (ticket.totalAmount || 0) - removedPrice)

    const result = await db.collection("tickets").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { 
        $set: { services: remainingServices, totalAmount: newTotal }
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
