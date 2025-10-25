"use client"

import { useState, useEffect } from "react"
import { VehicleConditionRecord } from "@/components/vehicle-condition-record"
import { PhotoUpload } from "@/components/photo-upload"
import { EditableTicketInfo } from "@/components/editable-ticket-info"
import { toast } from "sonner"
import type { Ticket, DamagePoint, Photo } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Trash2, Receipt } from "lucide-react"
import { File } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  // Partial payment state
  const [amountPaid, setAmountPaid] = useState<number | ''>(typeof ticket.amountPaid === 'number' ? ticket.amountPaid : '');
  const [isAmountPaidSaving, setIsAmountPaidSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [noteValue, setNoteValue] = useState(ticket.notes || "")
  const [notesavingloading, setnotesavingloading] = useState(false)
  const [originalNote] = useState(ticket.notes || "")
  const [exportLanguageMenuOpen, setExportLanguageMenuOpen] = useState(false)
  const [paymentTime, setPaymentTime] = useState(ticket.paymentTime ? new Date(ticket.paymentTime).toISOString().slice(0,16) : "")
  const [paymentMethod, setPaymentMethod] = useState(ticket.paymentMethod || "")
  const [customPaymentMethod, setCustomPaymentMethod] = useState("")
  const [isPaymentSaving, setIsPaymentSaving] = useState(false)

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

    // Payment method fee logic
    function getPaymentFee(method: string, amount: number): number {
      if (!method) return 0;
      const m = method.toLowerCase();
      if (m === 'myfatoorah' || m === 'maifatoora' || m === 'ماي فاتورة') return 0.275;
      if (m === 'knet' || m === 'knent') return 0;
      if (m === 'cash') return 0;
      if (m === 'tabby' || m === 'tabbykib') return amount * 0.0799;
      if (m === 'kib') return amount * 0.10;
      // Other or unknown
      return 0;
    }

  const paymentFee = getPaymentFee(paymentMethod || ticket.paymentMethod || '', totalAmount);
  const totalAfterFee = totalAmount - paymentFee;
  const remainingAmount = typeof amountPaid === 'number' ? Math.max(0, totalAfterFee - amountPaid) : totalAfterFee;

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

  // Update note value when ticket changes
  useEffect(() => {
    setNoteValue(ticket.notes || "")
  }, [ticket.notes])

  async function handleExportPDF(language: "english" | "arabic") {
    setIsExportingPdf(true)
    try {
      const jsPDFModule = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')

      const JsPDFClass = (jsPDFModule as any).default ?? jsPDFModule
      const autoTable = (autoTableModule as any).default ?? autoTableModule

      const doc = new JsPDFClass()
      const pageWidth = doc.internal.pageSize.getWidth()
      const isArabic = language === "arabic"
      // Fetch the base64 font data from the public folder
      const response = await fetch('/fonts/base64.txt');
      const amiriFontData = await response.text();
      doc.addFileToVFS('Amiri-Regular.ttf', amiriFontData); 
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');

      // Set font
      doc.setFont(isArabic ? "Amiri" : "helvetica", "normal")

      // Add logo image (placeholder - ensure logo.jpg exists)
      try {
        await new Promise((resolve, reject) => {
          const logoImg = new Image()
          logoImg.onload = () => {
            try {
              doc.addImage(logoImg, 'PNG', pageWidth / 2 - 20, 15, 40, 40)
              resolve(null)
            } catch (e) {
              reject(e)
            }
          }
          logoImg.onerror = reject
          logoImg.src = '/logo.jpg'
        })
      } catch (error) {
        console.error('Failed to load logo:', error)
      }

      // Company Name
      doc.setFontSize(28)
      doc.setFont("helvetica", "bold")
      doc.text("Protection", pageWidth / 2, 65, { align: "center" })

      // Decorative line
      doc.setDrawColor(2, 119, 189)
      doc.setLineWidth(0.5)
      doc.line(14, 75, pageWidth - 14, 75)

      // Title
      doc.setFontSize(16)
      const title = `Ticket ${String(ticket._id ?? "")}`
      doc.text(title, 14, 90, { align: "left" })

      // Ticket meta
      doc.setFontSize(10)
      const paymentMethodDisplay = ticket.paymentMethod ? ticket.paymentMethod : "-"
      const paymentTimeDisplay = ticket.paymentTime ? (isArabic ? new Date(ticket.paymentTime).toLocaleString('ar-EG') : new Date(ticket.paymentTime).toLocaleString()) : "-"
      const meta = isArabic ? [
        ["رقم التذكرة", String(ticket._id ?? "")],
        ["العميل", String(ticket.customerName ?? "")],
        ["رقم اللوحة", String(ticket.plateNumber ?? "")],
        ["تاريخ الإنشاء", ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('ar-EG') : ""],
        ["طريقة الدفع", paymentMethodDisplay],
        ["تاريخ الدفع", paymentTimeDisplay],
      ] : [
        ["Ticket ID", String(ticket._id ?? "")],
        ["Customer", String(ticket.customerName ?? "")],
        ["Plate Number", String(ticket.plateNumber ?? "")],
        ["Created At", ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""],
        ["Payment Method", paymentMethodDisplay],
        ["Payment Time", paymentTimeDisplay],
      ]

      if (typeof autoTable === "function") {
        autoTable(doc, {
          startY: 95,
          theme: "plain",
          body: meta,
          styles: { fontSize: 10, font: isArabic ? "Amiri" : "helvetica", halign: "left" },
          columnStyles: { 0: { halign: "left" }, 1: { halign: "left" } },
        })
      } else if ((doc as any).autoTable) {
        ;(doc as any).autoTable({
          startY: 95,
          theme: "plain",
          body: meta,
          styles: { fontSize: 10, font: isArabic ? "Amiri" : "helvetica", halign: "left" },
          columnStyles: { 0: { halign: "left" }, 1: { halign: "left" } },
        })
      }

      // Services table
      const headers = [
        "#",
        "Service ID",
        "Name (EN)",
        "Category",
        "Price (KWD)",
        "Final (KWD)",
        "Added At"
      ]

      const services = ticket.services ?? []
      const servicesBody = services.map((s, idx) => [
        String(idx + 1),
        String(s.serviceId ?? ""),
        isArabic ? String(s.serviceNameAr ?? s.serviceName ?? "") : String(s.serviceName ?? ""),
        String(s.category ?? ""),
        (typeof s.price === "number" ? s.price : Number(s.price ?? 0)).toFixed(3),
        (typeof s.finalPrice === "number" ? s.finalPrice : Number(s.finalPrice ?? s.price ?? 0)).toFixed(3),
        s.addedAt ? new Date(s.addedAt).toLocaleString('en-US') : ""
      ])

      const servicesStartY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : 120

      if (typeof autoTable === "function") {
        autoTable(doc, {
          head: [headers],
          body: servicesBody,
          startY: servicesStartY,
          styles: { fontSize: 10, font: isArabic ? "Amiri" : "helvetica", halign: "left" },
          headStyles: { fillColor: [2, 119, 189], textColor: 255, font: isArabic ? "Amiri" : "helvetica", halign: "left" },
          columnStyles: headers.reduce((acc, _, idx) => ({ ...acc, [idx]: { halign: "left" } }), {}),
        })
      }

      // Total
      const finalY = (doc as any).lastAutoTable?.finalY ?? servicesStartY + 40;
      doc.setFontSize(12);
      const totalLabel = `Total: ${Number(totalAmount).toFixed(3)} KWD`;
      doc.text(totalLabel, 14, finalY + 12, { align: "left" });
      doc.setFontSize(10);
      const feeLabel = `Payment Method Fee: ${paymentFee > 0 ? '- ' + paymentFee.toFixed(3) : '0.000'} KWD`;
      doc.text(feeLabel, 14, finalY + 20, { align: "left" });
      doc.setFontSize(12);
      const afterFeeLabel = `Total After Fee: ${totalAfterFee.toFixed(3)} KWD`;
      doc.text(afterFeeLabel, 14, finalY + 30, { align: "left" });
      // Amount Paid
      const paidLabel = `Amount Paid: ${(typeof ticket.amountPaid === 'number' ? ticket.amountPaid.toFixed(3) : '0.000')} KWD`;
      doc.setFontSize(12);
      doc.text(paidLabel, 14, finalY + 40, { align: "left" });
      // Remaining
      const remaining = typeof ticket.amountPaid === 'number' ? Math.max(0, totalAfterFee - ticket.amountPaid) : totalAfterFee;
      const remainingLabel = `Remaining: ${remaining.toFixed(3)} KWD`;
      doc.setFontSize(12);
      doc.text(remainingLabel, 14, finalY + 50, { align: "left" });

      // Signature boxes
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginFromBottom = 30
      const signatureY = pageHeight - marginFromBottom
      const boxWidth = 60
      const boxHeight = 15

      doc.setDrawColor(128, 128, 128)
      doc.rect(isArabic ? pageWidth - boxWidth - 14 : 14, signatureY, boxWidth, boxHeight)
      doc.setFontSize(8)
      doc.text("Customer Signature", isArabic ? pageWidth - 14 - boxWidth/2 : 14 + boxWidth/2, signatureY + boxHeight + 6, { align: "center" })

      doc.rect(isArabic ? 14 : pageWidth - boxWidth - 14, signatureY, boxWidth, boxHeight)
      doc.text("Company Signature", isArabic ? 14 + boxWidth/2 : pageWidth - 14 - boxWidth/2, signatureY + boxHeight + 6, { align: "center" })

      const filename = `ticket-${String(ticket._id ?? "export")}.pdf`
      doc.save(filename)
      toast.success(isArabic ? "تم تصدير التذكرة إلى PDF" : "Exported ticket to PDF")
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

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isExportingPdf}
                onClick={() => setExportLanguageMenuOpen((prev) => !prev)}
              >
                <File className="h-4 w-4" />
                Export PDF
                <span className="ml-2">▼</span>
              </Button>
              {exportLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow z-10">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => { setExportLanguageMenuOpen(false); handleExportPDF('english'); }}
                    disabled={isExportingPdf}
                  >
                    English
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => { setExportLanguageMenuOpen(false); handleExportPDF('arabic'); }}
                    disabled={isExportingPdf}
                  >
                    العربية
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {ticket.services && ticket.services.length > 0 ? (
          <div className="space-y-6">
            {/* Services by Category */}
            {['protection', 'tanting', 'painting', 'detailing', 'repair'].map(category => {
              const categoryServices = ticket.services?.filter(service => 
                (service as any).category === category
              ) || [];

              if (categoryServices.length === 0) return null;

              const categoryBg: Record<string, string> = {
                protection: 'bg-green-50',
                tanting: 'bg-yellow-50',
                painting: 'bg-red-50',
                detailing: 'bg-blue-50',
                repair: 'bg-gray-50'
              };

              return (
                <section key={category} className={`rounded-lg border p-4 ${categoryBg[category]}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold capitalize">{category}</h3>
                    <span className="text-sm text-muted-foreground">
                      {categoryServices.length} items
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryServices.map((service) => (
                      <ServiceCard
                        key={(service as any).serviceId ?? (service as any).serviceName}
                        service={service}
                        onRemove={() => onRemoveService?.((service as any).serviceId)}
                        isDeleting={deletingServiceIds.includes((service as any).serviceId)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            <div className="mt-2 pt-4 border-t border-border flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total Cost</span>
                </div>
                <div className="font-semibold text-lg">{totalAmount} KWD</div>
              </div>
              <div className=" flex flex-col md:flex-row gap-2 justify-end items-center">
                 <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground font-medium">Amount Paid:</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="border rounded px-2 py-1 text-sm"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: 100 }}
                  />
                  <Button
                    size="sm"
                    className="bg-[#002540]"
                    disabled={isAmountPaidSaving || amountPaid === (typeof ticket.amountPaid === 'number' ? ticket.amountPaid : '')}
                    onClick={async () => {
                      setIsAmountPaidSaving(true);
                      try {
                        const response = await fetch(`/api/tickets/${ticket._id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amountPaid: amountPaid === '' ? null : amountPaid }),
                        });
                        if (!response.ok) throw new Error("Failed to update amount paid");
                        const updatedTicket = await response.json();
                        toast.success("Amount paid updated!");
                        onUpdate?.(updatedTicket);
                      } catch (error) {
                        toast.error("Failed to update amount paid");
                      }
                      setIsAmountPaidSaving(false);
                    }}
                  >
                    {isAmountPaidSaving ? <Spinner size="sm" /> : "Save"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Remaining:</span>
                  <span className="font-semibold text-lg text-green-600">{remainingAmount} KWD</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
                {/* Partial Payment Section */}
               
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground font-medium">Payment Time:</label>
                  <input
                    type="datetime-local"
                    className="border rounded px-2 py-1 text-sm"
                    value={paymentTime}
                    onChange={e => setPaymentTime(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground font-medium">Payment Method:</label>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={paymentMethod}
                    onChange={e => {
                      setPaymentMethod(e.target.value)
                      if (e.target.value !== "other") setCustomPaymentMethod("")
                    }}
                  >
                    <option value="">Select</option>
                    <option value="myfatoorah">My fatoorah</option>
                    <option value="knent">Knent</option>
                    <option value="cash">Cash</option>
                    <option value="tabbykib">Tabby</option>
                    <option value="kib">KIB</option>
                    <option value="other">other</option>
                  </select>
                  {paymentMethod === "other" && (
                    <input
                      type="text"
                      className="border rounded px-2 py-1 text-sm ml-2"
                      placeholder="Type payment method"
                      value={customPaymentMethod}
                      onChange={e => setCustomPaymentMethod(e.target.value)}
                      style={{ minWidth: 80 }}
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  className="bg-[#002540]"
                  disabled={isPaymentSaving || (paymentTime === (ticket.paymentTime ? new Date(ticket.paymentTime).toISOString().slice(0,16) : "") && paymentMethod === (ticket.paymentMethod || "") && (!customPaymentMethod || customPaymentMethod === (ticket.paymentMethod || "")))}
                  onClick={async () => {
                    setIsPaymentSaving(true);
                    try {
                      const payload: any = {};
                      if (paymentTime !== (ticket.paymentTime ? new Date(ticket.paymentTime).toISOString().slice(0,16) : "")) {
                        payload.paymentTime = paymentTime ? new Date(paymentTime).toISOString() : null;
                      }
                      if (paymentMethod === "other") {
                        payload.paymentMethod = customPaymentMethod || "other";
                      } else if (paymentMethod !== (ticket.paymentMethod || "")) {
                        payload.paymentMethod = paymentMethod;
                      }
                      const response = await fetch(`/api/tickets/${ticket._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                      });
                      if (!response.ok) throw new Error("Failed to update payment info");
                      const updatedTicket = await response.json();
                      toast.success("Payment info updated!");
                      onUpdate?.(updatedTicket);
                    } catch (error) {
                      toast.error("Failed to update payment info");
                    }
                    setIsPaymentSaving(false);
                  }}
                >
                  {isPaymentSaving ? <Spinner size="sm" /> : "Save"}
                </Button>
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

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Notes</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              // if (!noteValue.trim()) {
              //   toast.error("Notes cannot be empty");
              //   return;
              // }
              if (noteValue.trim() === originalNote.trim()) {
                toast.error("No changes to save");
                return;
              }

              setnotesavingloading(true);
              try {
                const response = await fetch(`/api/tickets/${ticket._id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ notes: noteValue.trim() }),
                });

                if (!response.ok) throw new Error("Failed to update notes");

                const updatedTicket = await response.json();
                onUpdate?.(updatedTicket);
                toast.success("Notes saved successfully!");
              } catch (error) {
                console.error("Error updating notes:", error);
                toast.error("Failed to save notes. Please try again.");
              }
              setnotesavingloading(false);
            }}
            disabled={notesavingloading  || noteValue.trim() === originalNote.trim()}
          >
            {notesavingloading ? (
              <Spinner size="sm" className="" />
            ) : (
             "Save Notes"
            )}
          </Button>
        </div>
        <Textarea
          placeholder="Add any additional notes here..."
          className="min-h-[120px] mb-2"
          value={noteValue}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteValue(e.target.value)}
        />
      </div>
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
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-lg capitalize">{service.serviceName}</h4>
            {service.isCustom && (
              <p className="rounded-full px-2 py-1 text-white text-xs bg-[#002540]">
                Custom
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{service.serviceNameAr}</p>
        </div>
        <div className="flex items-center gap-4 justify-end">
          <div className="text-right">
            {service.discountValue ? (
              <>
                <div className="line-through text-sm text-muted-foreground">
                  {service.originalPrice || service.price} KD
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
                {service.finalPrice || service.price} KD
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