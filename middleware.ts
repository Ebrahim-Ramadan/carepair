import { NextRequest, NextResponse } from "next/server"
import { parse } from "cookie"

const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/api/logout",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]

const STATIC_PREFIXES = [
  "/_next",
  "/static",
  "/public",
  "/assets",
  "/_next/image",
]

const STATIC_EXT_REGEX = /\.(png|jpe?g|svg|gif|webp|avif|ico|bmp|css|js|txt|map)$/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public framework/static routes and explicit public paths
  if (
    STATIC_PREFIXES.some(p => pathname.startsWith(p)) ||
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/")) ||
    STATIC_EXT_REGEX.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Check session cookie for everything else (including root "/")
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    // preserve originally requested path + query so app can redirect back after login
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const { session } = parse(cookieHeader)
  if (!session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const parsed = JSON.parse(session)
    if (!parsed || !parsed.email) throw new Error("invalid session")
    return NextResponse.next()
  } catch {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ["/:path*"],
}