"use client"

import { VehicleConditionRecord } from "@/components/vehicle-condition-record"
import { PhotoUpload } from "@/components/photo-upload"
import { EditableTicketInfo } from "@/components/editable-ticket-info"
import { toast } from "sonner"
import type { Ticket, DamagePoint, Photo } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ListOrdered, Plus, X, Trash2, Receipt } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import LazyLoad from "./ui/lazyload"

type TicketViewProps = {
  ticket: Ticket
  onUpdate?: (t: Ticket) => void
  onRemoveService?: (id: string) => void
  deletingServiceIds?: string[]
  servicesRef?: React.RefObject<HTMLDivElement>
  onOpenAddService?: () => void
  onScrollToServices?: () => void
}

export function TicketView({ 
  ticket, 
  onUpdate, 
  onRemoveService, 
  deletingServiceIds = [],
  servicesRef,
  onOpenAddService,
  onScrollToServices,
}: TicketViewProps) {
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

  // Calculate the total price
  const calculateTotal = () => {
    if (!ticket.services || ticket.services.length === 0) return 0;
    
    return ticket.services.reduce((total, service) => {
      const servicePrice = typeof service.price === 'number' ? service.price : 0;
      return total + servicePrice;
    }, 0);
  };

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-4">
      {/* Editable Ticket Information */}
      <EditableTicketInfo ticket={ticket} onUpdate={onUpdate} />

      {/* Services Section - Add ref here */}
      <div ref={servicesRef} className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">Services</h3>
          <div className="flex items-center gap-2">
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onOpenAddService}
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>
        {ticket.services && ticket.services.length > 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4">
              <div className="space-y-3">
                {ticket.services.map((service) => (
                  <div key={service.serviceId} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{service.serviceName}</h4>
                        <p className="text-sm text-muted-foreground">{service.serviceNameAr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {typeof service.price === 'number' ? `${service.price} KD` : service.price}
                        </div>
                        <Button
                          onClick={() => onRemoveService(service.serviceId)}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={deletingServiceIds.includes(service.serviceId)}
                        >
                          {deletingServiceIds.includes(service.serviceId) ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total section */}
              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total</span>
                </div>
                <div className="font-semibold text-lg">{totalAmount} KD</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border border-dashed p-4 text-center rounded-lg">
            No services added yet
          </div>
        )}
      </div>
      
<LazyLoad>
      <VehicleConditionRecord points={ticket.vehicleConditionPoints} onPointsChange={handleConditionUpdate} />

</LazyLoad>

         {/* Vehicle Condition Record */}

<LazyLoad>
      {/* Before/After Photos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PhotoUpload
          title="Before pictures"
          photos={ticket.beforePhotos}
          onPhotosChange={(photos) => handlePhotosUpdate("before", photos)}
          ticketId={ticket._id!}
        />
        <PhotoUpload
          title="After pictures"
          photos={ticket.afterPhotos}
          onPhotosChange={(photos) => handlePhotosUpdate("after", photos)}
          ticketId={ticket._id!}
        />
      </div>
  </LazyLoad>
    </div>
  )
}
