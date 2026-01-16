import { Suspense } from "react"
import { CustomersClient } from "@/components/customers-client"
import { Metadata } from "next"
import { headers } from 'next/headers'
import LoadingDots from "@/components/ui/loading-spinner"


export const metadata: Metadata = {
  title: "Customers | NintyNine",
  description: "Search and manage customers with ease using NintyNine",
}

type SearchParams = {
  page?: string
  sortBy?: string
  category?: string
  period?: string
  startDate?: string
  endDate?: string
}

async function CustomersData({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams?.page || '1'
  const sortBy = searchParams?.sortBy || 'latest'
  const category = searchParams?.category || 'all'
  const period = searchParams?.period
  const startDate = searchParams?.startDate
  const endDate = searchParams?.endDate

  try {
    // Build a stable URL for undici/Node fetch: prefer absolute URL when host present.
    const headersList = headers()
    const host = headersList.get('host')

    const forwardedProto = headersList.get('x-forwarded-proto')
    const inferredProto = forwardedProto || (host && (host.includes('localhost') || process.env.NODE_ENV === 'development') ? 'http' : 'https')

    const base = host ? `${inferredProto}://${host}` : ''
    const params = new URLSearchParams()
    if (page) params.set('page', page)
    if (sortBy) params.set('sortBy', sortBy)
    if (category && category !== 'all') params.set('category', category)
    if (period) params.set('period', period)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const url = `${base}/api/customers?${params.toString()}`

    if (process.env.NODE_ENV !== 'production') console.log('Fetching customers from:', url)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cookie': headersList.get('cookie') || ''
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Customers API response error:', response.status, text)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content type for customers API:', contentType)
      throw new Error('API did not return JSON')
    }

    const data = await response.json()

    if (!data || !Array.isArray(data.customers) && !Array.isArray(data)) {
      console.error('Invalid customers data structure:', data)
      throw new Error('Invalid data structure received')
    }

    // Support APIs that return either an array directly or an object with `customers` key
    const customers = Array.isArray(data) ? data : data.customers

    return <CustomersClient initialCustomers={customers} initialFilters={{ category, period, startDate, endDate }} />
  } catch (error) {
    console.error('Detailed customers fetch error:', error)
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6">
        <p className="text-red-500">Failed to load customers: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
}

export default function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto min-h-screen">
      <Suspense fallback={<div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6">
        <LoadingDots/>
      </div>}>
        <CustomersData searchParams={searchParams} />
      </Suspense>
    </div>
  )
}