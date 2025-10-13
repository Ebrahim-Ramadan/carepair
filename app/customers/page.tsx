import { Suspense } from "react"
import { CustomersClient } from "@/components/customers-client"
import { Spinner } from "@/components/ui/spinner"
import { Metadata } from "next"
import { headers } from 'next/headers'


export const metadata: Metadata = {
  title: "Customers | NintyNine",
  description: "Search and manage customers with ease using NintyNine",
}

type SearchParams = {
  page?: string
  sortBy?: string
}

async function CustomersData({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams?.page || '1'
  const sortBy = searchParams?.sortBy || 'latest'

  try {
    // Build a stable URL for undici/Node fetch: prefer absolute URL when host present.
    const headersList = headers()
    const host = headersList.get('host')

    const forwardedProto = headersList.get('x-forwarded-proto')
    const inferredProto = forwardedProto || (host && (host.includes('localhost') || process.env.NODE_ENV === 'development') ? 'http' : 'https')

    const base = host ? `${inferredProto}://${host}` : ''
    const url = `${base}/api/customers?page=${page}&sortBy=${sortBy}&limit=10`

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

    return <CustomersClient initialCustomers={customers} />
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
      <Suspense fallback={<div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6"><Spinner/></div>}>
        <CustomersData searchParams={searchParams} />
      </Suspense>
    </div>
  )
}