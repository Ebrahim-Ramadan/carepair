import { Suspense } from "react"
import { AppointmentsClient } from "@/components/appointments-client"
import clientPromise from "@/lib/mongodb"

async function AppointmentsData() {
  const client = await clientPromise
  const db = client.db("car_repair")
  const appointments = await db
    .collection("appointments")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  // Convert MongoDB documents to plain objects
  const serializedAppointments = appointments.map(appointment => ({
    _id: appointment._id.toString(),
    customer: appointment.customer,
    vehicle: appointment.vehicle,
    service: appointment.service,
    status: appointment.status,
    createdAt: appointment.createdAt.toISOString()
  }))

  return <AppointmentsClient initialAppointments={serializedAppointments} />
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


