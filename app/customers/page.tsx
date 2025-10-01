import { Suspense } from "react"
import { CustomersClient } from "@/components/customers-client"

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
    <div className="mx-auto">
      <Suspense fallback={<div className="rounded-lg border border-border bg-card p-6">Loading customers...</div>}>
        <CustomersData />
      </Suspense>
    </div>
  )
}