import { NextRequest, NextResponse } from "next/server"
import { parse } from "cookie"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Protect /users and any other admin routes
  if (pathname.startsWith("/users")) {
    const cookie = request.headers.get("cookie")
    if (!cookie) return NextResponse.redirect(new URL("/login", request.url))
    const { session } = parse(cookie)
    if (!session) return NextResponse.redirect(new URL("/login", request.url))
    try {
      const { email, role } = JSON.parse(session)
      if (!email || !role) throw new Error("Invalid session")
      // Optionally, restrict to admin only:
      // if (role !== "admin") return NextResponse.redirect(new URL("/login", request.url))
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  return NextResponse.next()
}

// Enable middleware for /users and /users/*
export const config = {
  matcher: ["/users/:path*", "/users"],
}