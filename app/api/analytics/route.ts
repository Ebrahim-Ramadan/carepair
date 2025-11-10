import { NextRequest, NextResponse } from "next/server"
import { getAnalyticsData } from "@/lib/analytics"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const period = searchParams.get("period") || "all"
    const category = searchParams.get("category") || "all"
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    
    const analyticsData = await getAnalyticsData({
      period: period as string,
      category: category as string,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined
    })
    
    const response = NextResponse.json(analyticsData)
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    )
  }
}