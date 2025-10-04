import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  const client = await clientPromise
  const db = client.db("car_repair")
  const body = await request.json()
  const { email, password, role, currentUser } = body

  // Only allow admin to add users
  const admin = await db.collection("users").findOne({ email: currentUser, role: "admin" })
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Prevent duplicate emails
  const exists = await db.collection("users").findOne({ email })
  if (exists) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 })
  }

  await db.collection("users").insertOne({ email, password, role })
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const client = await clientPromise
  const db = client.db("car_repair")
  const email = request.headers.get("x-user-email") // Pass current user email in header

  const admin = await db.collection("users").findOne({ email, role: "admin" })
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const users = await db.collection("users").find({}, { projection: { password: 0 } }).toArray()
  return NextResponse.json(users)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await clientPromise
  const db = client.db("car_repair")
  const body = await request.json()
  const { email, role, currentUser } = body

  const admin = await db.collection("users").findOne({ email: currentUser, role: "admin" })
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(params.id) },
    { $set: { email, role } }
  )
  return NextResponse.json({ success: true })
}



export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await clientPromise
  const db = client.db("car_repair")
  const email = request.headers.get("x-user-email")

  const admin = await db.collection("users").findOne({ email, role: "admin" })
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await db.collection("users").deleteOne({ _id: new ObjectId(params.id) })
  return NextResponse.json({ success: true })
}