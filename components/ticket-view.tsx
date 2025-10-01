"use client"

import { VehicleConditionRecord } from "@/components/vehicle-condition-record"
import { PhotoUpload } from "@/components/photo-upload"
import { EditableTicketInfo } from "@/components/editable-ticket-info"
import { toast } from "sonner"
import type { Ticket, DamagePoint, Photo } from "@/lib/types"

type TicketViewProps = {
  ticket: Ticket
  onUpdate: (ticket: Ticket) => void
}

export function TicketView({ ticket, onUpdate }: TicketViewProps) {
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
      {/* Editable Ticket Information */}
      <EditableTicketInfo ticket={ticket} onUpdate={onUpdate} />

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
