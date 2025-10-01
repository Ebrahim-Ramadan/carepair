import { Suspense } from "react"
import { AppointmentsClient } from "@/components/appointments-client"

async function AppointmentsData() {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/appointments`, {
    cache: 'no-store' // Ensure fresh data on each request
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch appointments')
  }
  
  const appointments = await response.json()
  
  return <AppointmentsClient initialAppointments={appointments} />
}

export default function AppointmentsPage() {
  return (
    <div className="mx-auto">
      <Suspense fallback={<div className="rounded-lg border border-border bg-card p-6">Loading appointments...</div>}>
        <AppointmentsData />
      </Suspense>
    </div>
  )
}