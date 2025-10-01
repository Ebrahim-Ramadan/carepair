"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Edit, Save, X, User, Phone, Mail, Gauge, Car, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import type { Ticket } from "@/lib/types"

const REPAIR_PARTS = [
  "Front Bumper",
  "Rear Bumper", 
  "Left Door",
  "Right Door",
  "Hood",
  "Trunk",
  "Left Fender",
  "Right Fender",
  "Front Windshield",
  "Rear Windshield",
  "Side Mirror",
  "Headlight",
  "Taillight",
  "Grille",
  "Side Panel"
]

type EditableTicketInfoProps = {
  ticket: Ticket
  onUpdate: (ticket: Ticket) => void
}

export function EditableTicketInfo({ ticket, onUpdate }: EditableTicketInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [plateNumber, setPlateNumber] = useState(ticket.plateNumber)
  const [customerName, setCustomerName] = useState(ticket.customerName)
  const [customerPhone, setCustomerPhone] = useState(ticket.customerPhone)
  const [customerEmail, setCustomerEmail] = useState(ticket.customerEmail || "")
  const [mileage, setMileage] = useState(ticket.mileage.toString())
  const [repairParts, setRepairParts] = useState<string[]>(ticket.repairParts)

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
    setPlateNumber(ticket.plateNumber)
    setCustomerName(ticket.customerName)
    setCustomerPhone(ticket.customerPhone)
    setCustomerEmail(ticket.customerEmail || "")
    setMileage(ticket.mileage.toString())
    setRepairParts(ticket.repairParts)
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
        plateNumber: plateNumber.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        mileage: Number(mileage),
        repairParts,
      }

      const response = await fetch(`/api/tickets/${ticket._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Repair Parts</h3>
            <MultiSelect
              options={REPAIR_PARTS}
              selected={repairParts}
              onChange={setRepairParts}
              placeholder="Select repair parts..."
              className="w-full"
            />
          </div>
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
            <span className="font-mono">#{ticket._id?.slice(-6)}</span>
            <span>•</span>
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
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
                  <MessageCircle className="h-3 w-3 text-green-600 hover:text-green-800" />
                </button>
                <button
                  onClick={() => handlePhoneCall(ticket.customerPhone)}
                  className="p-1 rounded hover:bg-blue-100 transition-colors"
                  title="Call"
                >
                  <Phone className="h-3 w-3 text-blue-600 hover:text-blue-800" />
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
              <span className="text-foreground">{ticket.mileage.toLocaleString()} km</span>
            </div>
            {ticket.repairParts.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Repair Parts
                </div>
                <div className="flex flex-wrap gap-2">
                  {ticket.repairParts.map((part) => (
                    <span
                      key={part}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}