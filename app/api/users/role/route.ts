import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function POST(req: NextRequest) {
  const { userId, newRole, currentUser } = await req.json()
  if (currentUser !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  const client = await clientPromise
  const db = client.db("car_repair")
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { role: newRole } }
  )
  return NextResponse.json({ success: true })
}