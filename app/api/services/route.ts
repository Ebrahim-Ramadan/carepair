import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
        const client = await clientPromise
    const db = client.db("car_repair")
    // Get all services and service categories
    const services = await db.collection('services').find({}).toArray()
    const serviceCategories = await db.collection('serviceCategories').find({}).toArray()
    
    return NextResponse.json({
      services,
      serviceCategories
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}