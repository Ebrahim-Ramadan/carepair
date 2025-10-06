"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import type { Ticket, CreateTicketInput } from "@/lib/types"

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

type TicketFormProps = {
  onSuccess: (ticket: Ticket) => void
}

export function TicketForm({ onSuccess }: TicketFormProps) {
  const [plateNumber, setPlateNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [mileage, setMileage] = useState("")
  const [repairParts, setRepairParts] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const input: CreateTicketInput = {
        plateNumber,
        customerName,
        customerPhone,
        customerEmail,
        mileage: Number(mileage),
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (response.status === 403) {
        toast.error("You do not have permission to create tickets.")
        return
      }
      if (!response.ok) throw new Error("Failed to create ticket")

      const ticket = await response.json()
      toast.success("Ticket created successfully!")
      onSuccess(ticket)
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("Failed to create ticket. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vehicle Information */}
      <div className="space-y-4 -z-50">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vehicle Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plate Number *</Label>
            <Input
              id="plateNumber"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="ABC-1234"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage (km) </Label>
            <Input
              id="mileage"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="50000"
            />
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-4 -z-50">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Customer Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone Number *</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {REPAIR_PARTS.map((part) => (
            <div key={part} className="flex items-center space-x-2">
              <Checkbox
                id={part}
                checked={repairParts.includes(part)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setRepairParts([...repairParts, part])
                  } else {
                    setRepairParts(repairParts.filter((p) => p !== part))
                  }
                }}
              />
              <Label htmlFor={part} className="text-sm cursor-pointer">
                {part}
              </Label>
            </div>
          ))}
        </div>
      </div> */}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Ticket"}
      </Button>
    </form>
  )
}