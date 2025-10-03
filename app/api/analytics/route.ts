import { NextRequest, NextResponse } from "next/server"
import { getAnalyticsData } from "@/lib/analytics"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const period = searchParams.get("period") || "month"
    const category = searchParams.get("category") || "all"
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    
    const analyticsData = await getAnalyticsData({
      period: period as string,
      category: category as string,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined
    })
    
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    )
  }
}