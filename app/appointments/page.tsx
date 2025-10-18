import { Suspense } from "react"
import { AppointmentsClient } from "@/components/appointments-client"
import { Metadata } from "next"
import { headers } from 'next/headers'
import LoadingDots from "@/components/ui/loading-spinner"

export const metadata: Metadata = {
  title: "Appointments | NintyNine",
  description: "Manage and schedule appointments with ease using NintyNine",
}
type SearchParams = {
  page?: string
  sortBy?: string
}

async function AppointmentsData({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams.page || "1"
  const sortBy = searchParams.sortBy || "latest"
  
  try {
    // Build a stable URL for undici/Node fetch: prefer absolute URL when host present.
    const headersList = headers()
    const host = headersList.get('host')

    const forwardedProto = headersList.get('x-forwarded-proto')
    const inferredProto = forwardedProto || (host && (host.includes('localhost') || process.env.NODE_ENV === 'development') ? 'http' : 'https')

    const base = host ? `${inferredProto}://${host}` : ''
    const apiUrl = `${base}/api/appointments?page=${page}&sortBy=${sortBy}&limit=10`
    if (process.env.NODE_ENV !== 'production') console.log('Fetching from:', apiUrl)

    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cookie': headersList.get('cookie') || ''
      }
    })
    
    if (!response.ok) {
      const text = await response.text()
      console.error('API Response:', text)
      console.error('Status:', response.status)
      console.error('Headers:', Object.fromEntries(response.headers))
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content type:', contentType)
      throw new Error('API did not return JSON')
    }
    
    const data = await response.json()
    console.log('Received data:', JSON.stringify(data, null, 2))
    
    if (!data.appointments || !Array.isArray(data.appointments)) {
      console.error('Invalid data structure:', data)
      throw new Error('Invalid data structure received')
    }
    
    return <AppointmentsClient initialData={data} />
  } catch (error) {
    console.error('Detailed appointment fetch error:', error)
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6">
        <p className="text-red-500">Failed to load appointments: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
}

export default function AppointmentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto min-h-screen">
      <Suspense fallback={<div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6">
        <LoadingDots/>
      </div>}>
        <AppointmentsData searchParams={searchParams} />
      </Suspense>
    </div>
  )
}