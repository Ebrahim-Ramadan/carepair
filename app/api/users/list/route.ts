import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function GET(req: NextRequest) {
  const currentUser = req.nextUrl.searchParams.get("currentUser")
  if (currentUser !== ADMIN_EMAIL) {
    return NextResponse.json([], { status: 403 })
  }
  const client = await clientPromise
  const db = client.db("car_repair")
  const users = await db.collection("users").find({}, { projection: { password: 0 } }).toArray()
  return NextResponse.json(users.map(u => ({ _id: u._id.toString(), email: u.email, role: u.role })))
}