"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, RotateCcw } from "lucide-react"
import { toast } from "sonner"

type Appointment = {
  _id: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  vehicle: {
    make: string
    model: string
    year: string
    licensePlate: string
  }
  service: {
    type: string
    date?: string
    time: string
  }
  status: "pending" | "confirmed" | "completed" | "canceled"
  createdAt: string
}

function formatDate(value: string | Date) {
  const d = new Date(value)
  return d.toLocaleString()
}

type AppointmentsClientProps = {
  initialAppointments: Appointment[]
}

export function AppointmentsClient({ initialAppointments }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [changedStatuses, setChangedStatuses] = useState<Record<string, string>>({})

  const handleStatusChange = (appointmentId: string, newStatus: string) => {
    const originalStatus = initialAppointments.find(a => a._id === appointmentId)?.status
    if (newStatus === originalStatus) {
      // Remove from changed statuses if reverting to original
      setChangedStatuses(prev => {
        const { [appointmentId]: _, ...rest } = prev
        return rest
      })
    } else {
      // Add to changed statuses
      setChangedStatuses(prev => ({
        ...prev,
        [appointmentId]: newStatus
      }))
    }
  }

  const saveStatusChange = async (appointmentId: string) => {
    const newStatus = changedStatuses[appointmentId]
    if (!newStatus) return

    const appointment = appointments.find(a => a._id === appointmentId)
    if (!appointment) return

    setLoadingIds(prev => new Set(prev).add(appointmentId))
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          sendEmail: true,
          customerEmail: appointment.customer.email,
          customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
          vehicleInfo: `${appointment.vehicle.make} ${appointment.vehicle.model} ${appointment.vehicle.year}`,
          serviceType: appointment.service.type,
          serviceDate: appointment.service.date,
          serviceTime: appointment.service.time
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update appointment')
      }

      // Update the appointment in the local state
      setAppointments(prev => 
        prev.map(appointment => 
          appointment._id === appointmentId 
            ? { ...appointment, status: newStatus as Appointment['status'] }
            : appointment
        )
      )

      // Remove from changed statuses
      setChangedStatuses(prev => {
        const { [appointmentId]: _, ...rest } = prev
        return rest
      })

      // Show success toast
      toast.success(`Appointment status updated to ${newStatus} and email sent to customer`)
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Failed to update appointment status. Please try again.')
    } finally {
      setLoadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointmentId)
        return newSet
      })
    }
  }

  const revertStatusChange = (appointmentId: string) => {
    setChangedStatuses(prev => {
      const { [appointmentId]: _, ...rest } = prev
      return rest
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Appointments</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-2 md:px-4 py-1.5 md:py-3">Customer</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Contact</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Vehicle</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Service</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">When</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Status</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Created</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => {
              const isLoading = loadingIds.has(appointment._id)
              const hasChanges = changedStatuses.hasOwnProperty(appointment._id)
              const currentStatus = hasChanges ? changedStatuses[appointment._id] : appointment.status

              return (
                <tr key={appointment._id} className="border-b border-border last:border-0">
                  <td className="px-2 md:px-4 py-1.5 md:py-3">
                    {appointment.customer.firstName} {appointment.customer.lastName}
                  </td>
                  <td className="px-2 md:px-4 py-1.5 md:py-3">
                    <div>{appointment.customer.email}</div>
                    <div className="text-muted-foreground">{appointment.customer.phone}</div>
                  </td>
                  <td className="px-2 md:px-4 py-1.5 md:py-3">
                    {appointment.vehicle.make} {appointment.vehicle.model} {appointment.vehicle.year}
                    <div className="text-muted-foreground">{appointment.vehicle.licensePlate}</div>
                  </td>
                  <td className="px-2 md:px-4 py-1.5 md:py-3">{appointment.service.type}</td>
                  <td className="px-2 md:px-4 py-1.5 md:py-3">
                    {appointment.service.date ? new Date(appointment.service.date).toLocaleDateString() : "-"} {appointment.service.time}
                  </td>
                  <td className="px-2 md:px-4 py-1.5 md:py-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                      className={`${currentStatus === "pending" ? "bg-yellow-100 text-yellow-800" : 
                                  currentStatus === "confirmed" ? "bg-green-100 text-green-800" : 
                                  currentStatus === "completed" ? "bg-purple-100 text-purple-800" : 
                                  "bg-red-100 text-red-800"} 
                                  px-2 py-1 text-xs font-medium uppercase`}
                      variant={
                        currentStatus === "pending" ? "secondary" : 
                        currentStatus === "confirmed" ? "default" : 
                        currentStatus === "completed" ? "outline" : 
                        "destructive"
                      }>
                        {currentStatus}
                      </Badge>
                      {hasChanges && (
                        <span className="text-xs text-amber-600 font-medium">
                          *
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-1.5 md:py-3 text-muted-foreground">
                    {formatDate(appointment.createdAt)}
                  </td>
                  <td className="px-2 md:px-4 py-1.5 md:py-3">
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <Select
                        value={currentStatus}
                        onValueChange={(value) => handleStatusChange(appointment._id, value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {hasChanges && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveStatusChange(appointment._id)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Save changes"
                          >
                            {isLoading ? <Spinner size="sm" /> : <Save className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revertStatusChange(appointment._id)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            title="Revert changes"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}