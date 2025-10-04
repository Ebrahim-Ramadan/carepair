import { NextResponse } from "next/server"
import { serialize } from "cookie"

export async function POST() {
  const cookie = serialize("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
  })
  const res = NextResponse.json({ success: true })
  res.headers.set("Set-Cookie", cookie)
  return res
}