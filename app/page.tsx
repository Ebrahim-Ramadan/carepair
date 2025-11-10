
import { Metadata } from "next"
import { AnalyticsClient } from "@/components/analytics-client"
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: "Sales | NintyNine",
  description: "Business analytics and insights for NintyNine operations",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { 
    period?: string,
    category?: string,
    startDate?: string,
    endDate?: string
  }
}) {
  // Get period from search params (default to 'all')
  const period = searchParams.period || 'all'
  const category = searchParams.category || 'all'
  const startDate = searchParams.startDate
  const endDate = searchParams.endDate
  
  try {
    // Build URL
    const headersList = headers()
    const host = headersList.get('host')
    const forwardedProto = headersList.get('x-forwarded-proto')
    const inferredProto = forwardedProto || (host && (host.includes('localhost') || process.env.NODE_ENV === 'development') ? 'http' : 'https')
    const base = host ? `${inferredProto}://${host}` : ''
    
    // Build query string
    const params = new URLSearchParams()
    params.set('period', period)
    params.set('category', category)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    
    const url = `${base}/api/analytics?${params.toString()}`

    if (process.env.NODE_ENV !== 'production') console.log('Fetching analytics from:', url)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cookie': headersList.get('cookie') || ''
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Analytics API response error:', response.status, text)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content type for analytics API:', contentType)
      throw new Error('API did not return JSON')
    }

    const analyticsData = await response.json()

    if (!analyticsData) {
      console.error('Invalid analytics data structure:', analyticsData)
      throw new Error('Invalid data structure received')
    }

    console.log('analyticsData', analyticsData)
    
    return (
      <div className="w-full mx-auto">
        <AnalyticsClient initialData={analyticsData} />
      </div>
    )
  } catch (error) {
    console.error("Detailed analytics fetch error:", error)
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6">
        <p className="text-red-500">Failed to load analytics: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
}