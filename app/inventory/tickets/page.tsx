import { DashboardClient } from "@/components/dashboard-client"
import { headers } from 'next/headers'

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Home({ searchParams }: { searchParams?: { page?: string } }) {
  try {
    const page = searchParams?.page || '1'
    
    // Build URL
    const headersList = headers()
    const host = headersList.get('host')
    const forwardedProto = headersList.get('x-forwarded-proto')
    const inferredProto = forwardedProto || (host && (host.includes('localhost') || process.env.NODE_ENV === 'development') ? 'http' : 'https')
    const base = host ? `${inferredProto}://${host}` : ''
    const url = `${base}/api/tickets?page=${page}`

    if (process.env.NODE_ENV !== 'production') console.log('Fetching tickets from:', url)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cookie': headersList.get('cookie') || ''
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Tickets API response error:', response.status, text)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || !data.tickets) {
      console.error('Invalid tickets data structure:', data)
      throw new Error('Invalid data structure received')
    }

    return <DashboardClient initialTickets={data.tickets} page={data.page} totalPages={data.totalPages} total={data.total} />
  } catch (error) {
    console.error("Error fetching tickets:", error)
    throw new Error("Failed to load tickets. Please try again later.")
  }
}