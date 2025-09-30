import { Suspense } from "react"
import { Badge } from "@/components/ui/badge"
import clientPromise from "@/lib/mongodb"

function formatDate(value: string | Date) {
  const d = new Date(value)
  return d.toLocaleString()
}

async function AppointmentsTable() {
  const client = await clientPromise
  const db = client.db("car_repair")
  const appointments = await db
    .collection("appointments")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()
console.log('appointments', appointments);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Appointments</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a: any) => (
              <tr key={a._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  {a.customer.firstName} {a.customer.lastName}
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{a.customer.email}</div>
                  <div className="text-muted-foreground">{a.customer.phone}</div>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {a.vehicle.make} {a.vehicle.model} {a.vehicle.year}
                  <div className="text-muted-foreground">{a.vehicle.licensePlate}</div>
                </td>
                <td className="px-4 py-3 text-foreground">{a.service.type}</td>
                <td className="px-4 py-3 text-foreground">
                  {a.service.date ? new Date(a.service.date).toLocaleDateString() : "-"} {a.service.time}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={a.status === "pending" ? "secondary" : a.status === "confirmed" ? "default" : a.status === "completed" ? "outline" : "destructive"}>
                    {a.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <Suspense fallback={<div className="rounded-lg border border-border bg-card p-6">Loading appointments...</div>}>
        <AppointmentsTable />
      </Suspense>
    </div>
  )
}


