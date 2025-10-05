import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

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
  try {
    // read session from cookie and verify admin
    const session = request.cookies.get("session")?.value
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    let parsed: { email?: string; role?: string } = {}
    try {
      parsed = JSON.parse(session)
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const email = parsed.email
    const role = parsed.role

    // require admin role (or env admin email)
    if (!(role === "admin" || email === ADMIN_EMAIL)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db("car_repair")

    // ensure user exists
    const user = await db.collection("users").findOne({ _id: new ObjectId(params.id) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }



    const result = await db.collection("users").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete user error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}