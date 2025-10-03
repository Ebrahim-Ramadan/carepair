import { Suspense } from "react"
import { CustomersClient } from "@/components/customers-client"
import { Spinner } from "@/components/ui/spinner"
import { Metadata } from "next"


export const metadata: Metadata = {
  title: "Customers | CarePair",
  description: "Search and manage customers with ease using CarePair",
}

async function CustomersData() {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/customers`, {
    cache: 'no-store' // Ensure fresh data on each request
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch customers')
  }
  
  const customers = await response.json()
  
  return <CustomersClient initialCustomers={customers} />
}

export default function CustomersPage() {
  return (
    <div className="mx-auto min-h-screen">
      <Suspense fallback={<div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6"><Spinner/></div>}>
        <CustomersData />
      </Suspense>
    </div>
  )
}