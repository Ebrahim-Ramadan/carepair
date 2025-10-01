"use client"

import { VehicleConditionRecord } from "@/components/vehicle-condition-record"
import { PhotoUpload } from "@/components/photo-upload"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Phone, Mail, Gauge } from "lucide-react"
import { toast } from "sonner"
import type { Ticket, DamagePoint, Photo } from "@/lib/types"

type TicketViewProps = {
  ticket: Ticket
  onUpdate: (ticket: Ticket) => void
}

export function TicketView({ ticket, onUpdate }: TicketViewProps) {
  // Ticket details are loaded by the parent before rendering this component.
  const handleConditionUpdate = async (points: DamagePoint[]) => {
    try {
      const response = await fetch(`/api/tickets/${ticket._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleConditionPoints: points }),
      })

      if (!response.ok) throw new Error("Failed to update vehicle condition")

      const updatedTicket = await response.json()
      toast.success("Vehicle condition updated successfully!")
      onUpdate(updatedTicket)
    } catch (error) {
      console.error("Error updating vehicle condition:", error)
      toast.error("Failed to update vehicle condition. Please try again.")
    }
  }

  const handlePhotosUpdate = async (type: "before" | "after", photos: Photo[]) => {
    try {
      const response = await fetch(`/api/tickets/${ticket._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type === "before" ? "beforePhotos" : "afterPhotos"]: photos,
        }),
      })

      if (!response.ok) throw new Error("Failed to update photos")

      const updatedTicket = await response.json()
      toast.success(`${type === "before" ? "Before" : "After"} photos updated successfully!`)
      onUpdate(updatedTicket)
    } catch (error) {
      console.error("Error updating photos:", error)
      toast.error("Failed to update photos. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{ticket.plateNumber}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(ticket.createdAt).toLocaleString()}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Ticket #{ticket._id?.slice(-6)}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{ticket.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{ticket.customerPhone}</span>
            </div>
            {ticket.customerEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{ticket.customerEmail}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{ticket.mileage} km</span>
            </div>
            {ticket.repairParts.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Repair Parts
                </div>
                <div className="flex flex-wrap gap-2">
                  {ticket.repairParts.map((part) => (
                    <Badge key={part} variant="outline">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Condition Record */}
      <VehicleConditionRecord points={ticket.vehicleConditionPoints} onPointsChange={handleConditionUpdate} />

      {/* Before/After Photos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PhotoUpload
          title="Before Repair"
          photos={ticket.beforePhotos}
          onPhotosChange={(photos) => handlePhotosUpdate("before", photos)}
          ticketId={ticket._id!}
        />
        <PhotoUpload
          title="After Repair"
          photos={ticket.afterPhotos}
          onPhotosChange={(photos) => handlePhotosUpdate("after", photos)}
          ticketId={ticket._id!}
        />
      </div>
    </div>
  )
}
