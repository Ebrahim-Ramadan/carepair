import { NextRequest, NextResponse } from "next/server"
import { parse } from "cookie"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Skip auth for login and other public routes
  if (pathname.startsWith("/login")) {
    return NextResponse.next()
  }
  const cookie = request.headers.get("cookie")
  if (!cookie) return NextResponse.redirect(new URL("/login", request.url))
  const { session } = parse(cookie)
  if (!session) return NextResponse.redirect(new URL("/login", request.url))
  try {
    const { email, role } = JSON.parse(session)
    if (!email || !role) throw new Error("Invalid session")
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Enable middleware for all routes except public/static
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}