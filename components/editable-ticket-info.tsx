"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Save, X, User, Phone, Mail, Gauge, Car, MessageCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import type { Ticket } from "@/lib/types"


type EditableTicketInfoProps = {
  ticket: Ticket
  onUpdate: (ticket: Ticket) => void
}

export function EditableTicketInfo({ ticket, onUpdate }: EditableTicketInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  console.log('ticket:', ticket)  
  
  // Form state
  const [plateNumber, setPlateNumber] = useState(ticket.plateNumber)
  const [invoiceNo, setInvoiceNo] = useState(ticket.invoiceNo)
  const [customerName, setCustomerName] = useState(ticket.customerName)
  const [customerPhone, setCustomerPhone] = useState(ticket.customerPhone)
  const [customerEmail, setCustomerEmail] = useState(ticket.customerEmail || "")
  const [mileage, setMileage] = useState(ticket.mileage.toString())
  const [isCheckup, setIsCheckup] = useState(ticket.isCheckup || false)
  const [createdAt, setCreatedAt] = useState(ticket.createdAt ? new Date(ticket.createdAt).toISOString().split('T')[0] : "")

  const handleEmailClick = (email: string) => {
    // window.open(`mailto:${email}`, '_blank')
    window.open(`https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${email}&su=Hello&body=Message&tf=cm`, '_blank')

  }

  const handleWhatsAppClick = (phone: string) => {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    // Reset form to original values
    setInvoiceNo(ticket.invoiceNo)
    setPlateNumber(ticket.plateNumber)
    setCustomerName(ticket.customerName)
    setCustomerPhone(ticket.customerPhone)
    setCustomerEmail(ticket.customerEmail || "")
    setMileage(ticket.mileage?.toString())
    setIsCheckup(ticket.isCheckup || false)
    setCreatedAt(ticket.createdAt ? new Date(ticket.createdAt).toISOString().split('T')[0] : "")
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!plateNumber.trim() || !customerName.trim() || !customerPhone.trim() || !mileage.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const updateData = {
        invoiceNo: invoiceNo?.trim(),
        plateNumber: plateNumber.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        mileage: Number(mileage),
        isCheckup: isCheckup,
        createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
      }

      const response = await fetch(`/api/tickets/${ticket._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      if (response.status === 403) {
        toast.error("You do not have permission to edit this ticket.")
        return
      }
      if (!response.ok) throw new Error("Failed to update ticket")

      const updatedTicket = await response.json()
      toast.success("Ticket information updated successfully!")
      onUpdate(updatedTicket)
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast.error("Failed to update ticket. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex w-full flex-col md:flex-row gap-2 md:items-center items-center justify-between">
          <h2 className="text-xl w-full font-semibold text-foreground">Edit Ticket Information</h2>
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vehicle Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-invoiceNo">Invoice No</Label>
                <Input
                  id="edit-invoiceNo"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Invoice No"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-plateNumber">Plate Number *</Label>
                <Input
                  id="edit-plateNumber"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="ABC-1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mileage">Mileage (km) *</Label>
                <Input
                  id="edit-mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="50000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-createdAt">Ticket Date</Label>
                <Input
                  id="edit-createdAt"
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="edit-checkup"
                  checked={isCheckup}
                  onCheckedChange={(checked) => setIsCheckup(checked as boolean)}
                />
                <Label htmlFor="edit-checkup">Checkup </Label>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Customer Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-customerName">Name *</Label>
                <Input
                  id="edit-customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-customerPhone">Phone Number *</Label>
                <Input
                  id="edit-customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-customerEmail">Email</Label>
              <Input
                id="edit-customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          {/* Repair Parts */}
          {/* <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Repair Parts</h3>
            <MultiSelect
              options={REPAIR_PARTS}
              selected={repairParts}
              onChange={setRepairParts}
              placeholder="Select repair parts..."
              className="w-full"
            />
          </div> */}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Car className="h-6 w-6" />
            {ticket.plateNumber}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">#{ticket.invoiceNo}</span>
            <span>•</span>
            <span className="flex justify-center items-center flex-row">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
              
              {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Customer Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{ticket.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{ticket.customerPhone}</span>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => handleWhatsAppClick(ticket.customerPhone)}
                  className="p-1 rounded hover:bg-green-100 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-3 w-3 text-[#EC653B] hover:text-green-800" />
                </button>
                <button
                  onClick={() => handlePhoneCall(ticket.customerPhone)}
                  className="p-1 rounded hover:bg-blue-100 transition-colors"
                  title="Call"
                >
                  <Phone className="h-3 w-3 text-[#EC653B] hover:text-blue-800" />
                </button>
              </div>
            </div>
            {ticket.customerEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => handleEmailClick(ticket.customerEmail!)}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {ticket.customerEmail}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vehicle Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{ticket.mileage?.toLocaleString()} km</span>
            </div>
            {/* <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div> */}
            {ticket.isCheckup && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                  Checkup 
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}