import { Suspense } from "react"
import { AppointmentsClient } from "@/components/appointments-client"
import { Spinner } from "@/components/ui/spinner"

type SearchParams = {
  page?: string
  sortBy?: string
}

async function AppointmentsData({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams.page || "1"
  const sortBy = searchParams.sortBy || "latest"
  
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/appointments?page=${page}&sortBy=${sortBy}&limit=10`, {
    cache: 'no-store' // Ensure fresh data on each request
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch appointments')
  }
  
  const data = await response.json()
  
  return <AppointmentsClient initialData={data} />
}

export default function AppointmentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto min-h-screen">
      <Suspense fallback={<div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6"><Spinner/></div>}>
        <AppointmentsData searchParams={searchParams} />
      </Suspense>
    </div>
  )
}