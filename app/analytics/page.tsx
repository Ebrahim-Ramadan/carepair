import { Metadata } from "next"
import { AnalyticsClient } from "@/components/analytics-client"
import { getAnalyticsData } from "@/lib/analytics"

export const metadata: Metadata = {
  title: "Analytics | CarePair",
  description: "Business analytics and insights for CarePair operations",
}

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
  // Get period from search params (default to 'month')
  const period = searchParams.period || 'month'
  const category = searchParams.category || 'all'
  const startDate = searchParams.startDate
  const endDate = searchParams.endDate
  
  // Fetch analytics data based on filters
  const analyticsData = await getAnalyticsData({
    period,
    category,
    startDate,
    endDate
  })
  
  return (
    <div className="w-full mx-auto">
      <AnalyticsClient initialData={analyticsData} />
    </div>
  )
}