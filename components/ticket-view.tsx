"use client"

import { useState, useEffect } from "react"
import { VehicleConditionRecord } from "@/components/vehicle-condition-record"
import { PhotoUpload } from "@/components/photo-upload"
import { EditableTicketInfo } from "@/components/editable-ticket-info"
import { toast } from "sonner"
import type { Ticket, DamagePoint, Photo } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ListOrdered, Plus, X, Trash2, Receipt } from "lucide-react"
import { File } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import LazyLoad from "./ui/lazyload"
import { useEffect as useEff } from "react"

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
  const [isExportingPdf, setIsExportingPdf] = useState(false)

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
      onUpdate?.(updatedTicket)
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
      onUpdate?.(updatedTicket)
    } catch (error) {
      console.error("Error updating photos:", error)
      toast.error("Failed to update photos. Please try again.")
    }
  }

  // Calculate the total price, default to 0 if services don't exist
  const totalAmount = ticket.services?.reduce((sum, service) => 
    sum + (service.finalPrice ?? service.price), 0
  ) ?? 0

  // Update total in database if it's different
  useEffect(() => {
    if (ticket._id && typeof ticket.totalAmount !== 'undefined' && ticket.totalAmount !== totalAmount) {
      fetch(`/api/tickets/${ticket._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount })
      }).catch(error => {
        console.error('Error updating total amount:', error)
      })
    }
  }, [ticket._id, ticket.totalAmount, totalAmount])

    // Replace the existing handleExportPDF with the updated implementation
    async function handleExportPDF() {
      setIsExportingPdf(true)
      try {
        // dynamic imports with commonjs / es module interop handling
        const jsPDFModule = await import('jspdf')
        const autoTableModule = await import('jspdf-autotable')

        const JsPDFClass = (jsPDFModule as any).default ?? jsPDFModule
        const autoTable = (autoTableModule as any).default ?? autoTableModule

        const doc = new JsPDFClass()

        // Title
        doc.setFontSize(16)
        doc.text(`Ticket ${String(ticket._id ?? "")}`, 14, 16)

        // Ticket meta — align with provided Ticket type (customerName, plateNumber, etc.)
        doc.setFontSize(10)
        const meta = [
          ["Ticket ID", String(ticket._id ?? "")],
          ["Customer", String(ticket.customerName ?? "")],
          ["Plate Number", String(ticket.plateNumber ?? "")],
          ["Created At", ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""],
        ]

        // Render meta table (plain) — ensure autoTable call shape is correct
        if (typeof autoTable === "function") {
          autoTable(doc, {
            startY: 22,
            theme: "plain",
            body: meta,
            styles: { fontSize: 10 }
          })
        } else if ((doc as any).autoTable) {
          ;(doc as any).autoTable({
            startY: 22,
            theme: "plain",
            body: meta,
            styles: { fontSize: 10 }
          })
        } else {
          console.warn("autoTable not available - skipping meta table")
        }

        // Services table headers and body must have matching column counts
        const headers = [
          "Service ID",
          "Name (EN)",
          "Category",
          "Price (KWD)",
          "Final (KWD)",
          "Discount Type",
          "Discount Value",
          "Added At"
        ]

        const services = ticket.services ?? []
        const servicesBody = services.map((s) => [
          String(s.serviceId ?? ""),
          String(s.serviceName ?? ""),
          String(s.category ?? ""),
          // Ensure numeric values are normalized to fixed 3-decimal strings
          (typeof s.price === "number" ? s.price : Number(s.price ?? 0)).toFixed(3),
          (typeof s.finalPrice === "number" ? s.finalPrice : Number(s.finalPrice ?? s.price ?? 0)).toFixed(3),
          String(s.discountType ?? ""),
          // discountValue may be number | undefined
          (typeof s.discountValue === "number" ? s.discountValue : (s.discountValue ?? "")).toString(),
          s.addedAt ? new Date(s.addedAt).toLocaleString() : ""
        ])

        // startY should follow the last autoTable if present
        const servicesStartY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : 50

        if (typeof autoTable === "function") {
          autoTable(doc, {
            head: [headers],
            body: servicesBody,
            startY: servicesStartY,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [2, 119, 189], textColor: 255 }
          })
        } else if ((doc as any).autoTable) {
          ;(doc as any).autoTable({
            head: [headers],
            body: servicesBody,
            startY: servicesStartY,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [2, 119, 189], textColor: 255 }
          })
        } else {
          throw new Error("autoTable is not available in the imported module")
        }

        // Total at bottom
        const finalY = (doc as any).lastAutoTable?.finalY ?? servicesStartY + 40
        doc.setFontSize(12)
        doc.text(`Total: ${Number(totalAmount).toFixed(3)} KWD`, 14, finalY + 12)

        const filename = `ticket-${String(ticket._id ?? "export")}.pdf`
        doc.save(filename)
        toast.success("Exported ticket to PDF")
      } catch (err) {
        console.error("Error exporting PDF:", err)
        toast.error("Failed to export PDF")
      } finally {
        setIsExportingPdf(false)
      }
    }

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
              Add 
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
            >
              {isExportingPdf ? (
                <>
                  <Spinner size="sm" className="" />
                  Exporting...
                </>
              ) : (
                <>
                  <File className="h-4 w-4 " />
                  Export PDF
                </>
              )}
            </Button>

          </div>
        </div>
        {ticket.services && ticket.services.length > 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4">
              <div className="space-y-3">
                {ticket.services.map((service) => (
                  <ServiceCard
                    key={(service as any).serviceId ?? service.serviceName}
                    service={service as any}
                    onRemove={() => onRemoveService?.((service as any).serviceId)}
                    isDeleting={deletingServiceIds.includes((service as any).serviceId)}
                  />
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

type ServiceCardProps = {
  service: any
  onRemove: () => void
  isDeleting: boolean
}

function ServiceCard({ service, onRemove, isDeleting }: ServiceCardProps) {
  return (
    <div className="border rounded-md p-3">
      <div className="flex [&>*]:w-full justify-between items-start flex-col md:flex-row w-full">
        <div>
          <h4 className="font-medium">{service.serviceName}</h4>
          <p className="text-sm text-muted-foreground">{service.serviceNameAr}</p>
        </div>
        <div className="flex items-center gap-4 justify-end">
          <div className="text-right">
            {service.discountValue ? (
              <>
                <div className="line-through text-sm text-muted-foreground">
                  {service.price} KD
                </div>
                <div className="text-sm font-medium text-green-600">
                  {service.finalPrice} KD
                </div>
                <div className="text-xs text-muted-foreground">
                  {service.discountType === 'percentage' 
                    ? `${service.discountValue}% off`
                    : `${service.discountValue} KD off`
                  }
                </div>
              </>
            ) : (
              <div className="text-sm font-medium">
                {service.price} KD
              </div>
            )}
          </div>
          <Button
            onClick={onRemove}
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Spinner size="sm" />
            ) : (
              <Trash2 className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
