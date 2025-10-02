"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MessageCircle, Calendar, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react"
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

type Pagination = {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNext: boolean
  hasPrevious: boolean
}

type AppointmentsData = {
  appointments: Appointment[]
  pagination: Pagination
  sortBy: string
}

function formatDate(value: string | Date) {
  const d = new Date(value)
  return d.toLocaleString()
}

function formatTime(timeString: string) {
  if (!timeString || typeof timeString !== 'string') return "No time"
  
  try {
    const [hours, minutes] = timeString.split(':')
    if (!hours || !minutes) return timeString
    
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error("Error formatting time:", error)
    return timeString
  }
}

type AppointmentsClientProps = {
  initialData: AppointmentsData
}

export function AppointmentsClient({ initialData }: AppointmentsClientProps) {
  const router = useRouter()
  
  const [data, setData] = useState<AppointmentsData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set("page", page.toString())
    router.push(url.toString())
  }

  const handleSortChange = async (sortBy: string) => {
    setIsLoading(true)
    
    try {
      const url = new URL(window.location.href)
      url.searchParams.set("sortBy", sortBy)
      url.searchParams.set("page", "1")
      
      const response = await fetch(`/api/appointments?page=1&sortBy=${sortBy}&limit=10`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointments")
      }
      
      const newData = await response.json()
      setData(newData)
      
      router.push(url.toString())
    } catch (error) {
      console.error("Sort error:", error)
      toast.error("Failed to sort appointments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailClick = (email: string) => {
    window.open(`https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${email}&su=Hello&body=Message&tf=cm`, '_blank')
  }

  const handleWhatsAppClick = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    const appointment = data.appointments.find(a => a._id === appointmentId)
    if (!appointment) return

    setUpdatingIds(prev => new Set(prev).add(appointmentId))
    
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

      // Update local state
      setData(prevData => ({
        ...prevData,
        appointments: prevData.appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: newStatus as Appointment['status'] }
            : apt
        )
      }))

      toast.success(`Appointment status updated to ${newStatus} and email sent to customer`)
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Failed to update appointment status. Please try again.')
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointmentId)
        return newSet
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "completed":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "canceled":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "canceled", label: "Canceled" }
  ]

  return (
    <div className=" p-2 md:p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{data.pagination.totalCount} Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer appointments and schedules
          </p>
        </div>
        
        <div className="flex items-center gap-4 justify-end">
          
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={data.sortBy} onValueChange={handleSortChange} disabled={isLoading}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3 w-3" />
                    Latest First
                  </div>
                </SelectItem>
                <SelectItem value="earliest">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3" />
                    Earliest First
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Spinner size="lg" />
          </div>
        </div>
      )}

      {/* Appointments Table */}
      {!isLoading && (
        <>
          {data.appointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No appointments found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No appointments have been scheduled yet.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-2">
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.appointments.map((appointment) => {
                      const isUpdating = updatingIds.has(appointment._id)

                      return (
                        <tr key={appointment._id} className="border-b border-border last:border-0">
                          <td className="px-2 md:px-4 py-1.5 md:py-3">
                            {appointment.customer.firstName} {appointment.customer.lastName}
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <button
                                onClick={() => handleEmailClick(appointment.customer.email)}
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-xs"
                              >
                                {appointment.customer.email}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                              <Phone className="h-3 w-3" />
                              <span className="text-foreground text-xs">{appointment.customer.phone}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleWhatsAppClick(appointment.customer.phone)}
                                  className="p-1 rounded hover:bg-green-100 transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3 text-green-600 hover:text-green-800" />
                                </button>
                                <button
                                  onClick={() => handlePhoneCall(appointment.customer.phone)}
                                  className="p-1 rounded hover:bg-blue-100 transition-colors"
                                  title="Call"
                                >
                                  <Phone className="h-3 w-3 text-blue-600 hover:text-blue-800" />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3">
                            <div className="text-xs">
                              {appointment.vehicle.make} {appointment.vehicle.model} {appointment.vehicle.year}
                              <div className="text-muted-foreground">{appointment.vehicle.licensePlate}</div>
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3 text-xs">{appointment.service.type}</td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3 text-xs">
                            {appointment.service.date ? new Date(appointment.service.date).toLocaleDateString() : "-"}
                            <br />
                            {formatTime(appointment.service.time)}
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3">
                            <div className="flex items-center gap-2">
                              {/* Clickable Status Dropdown */}
                              <Select 
                                value={appointment.status} 
                                onValueChange={(value) => handleStatusChange(appointment._id, value)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger 
                                  className={`w-auto border-0 px-2 py-1 h-auto text-xs font-medium rounded-full uppercase ${getStatusColor(appointment.status)} transition-colors`}
                                >
                                  {isUpdating ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <>
                                      <SelectValue />
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </>
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getStatusColor(option.value).split(' ')[0]}`} />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3 text-muted-foreground text-xs">
                            {formatDate(appointment.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center text-sm text-muted-foreground sm:text-left">
                Showing {((data.pagination.currentPage - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.currentPage * data.pagination.limit, data.pagination.totalCount)} of{' '}
                {data.pagination.totalCount} appointments
              </div>
              
              <div className="flex items-center justify-center gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.currentPage - 1)}
                  disabled={!data.pagination.hasPrevious || isLoading}
                  className="gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, data.pagination.currentPage - 2)
                    const pageNum = startPage + i
                    
                    if (pageNum > data.pagination.totalPages) return null
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === data.pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.currentPage + 1)}
                  disabled={!data.pagination.hasNext || isLoading}
                  className="gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}