import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function POST(req: NextRequest) {
  const { email, password, role, currentUser } = await req.json()
  console.log('Adding user:', { email, role, currentUser })

  // Check if currentUser is the admin from .env
  if (currentUser !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  // Prevent creating the env admin account as a DB user
  if (email && ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Cannot create admin user" }, { status: 400 })
  }
  
  const client = await clientPromise
  const db = client.db("car_repair")

  const exists = await db.collection("users").findOne({ email })
  if (exists) return NextResponse.json({ error: "User exists" }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)
  await db.collection("users").insertOne({ email, password: hashed, role })
  return NextResponse.json({ success: true })
}