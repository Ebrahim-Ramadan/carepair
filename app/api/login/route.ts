import { NextRequest, NextResponse } from "next/server"
import { serialize } from "cookie"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // Check admin credentials from .env
  if (email === ADMIN_EMAIL) {
    
    const passwordMatch = ADMIN_PASSWORD === password
    
    if (!passwordMatch) {
      return NextResponse.json({ success: false }, { status: 401 })
    }
    const session = JSON.stringify({ email: ADMIN_EMAIL, role: "admin" })
    const cookie = serialize("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days for admin

      sameSite: "lax",
    })
    const res = NextResponse.json({ success: true })
    res.headers.set("Set-Cookie", cookie)
    return res
  }
  // Non-admin users (from DB)
  const client = await clientPromise
  const db = client.db("car_repair")
  const user = await db.collection("users").findOne({ email })
  if (!user) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  // If passwords are hashed in DB, use bcrypt.compare
  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const session = JSON.stringify({ email: user.email, role: user.role })
  const cookie = serialize("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  })
  const res = NextResponse.json({ success: true })
  res.headers.set("Set-Cookie", cookie)
  return res
}