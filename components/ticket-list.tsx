"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Trash2, Calendar } from "lucide-react"
import type { Ticket } from "@/lib/types"

type TicketListProps = {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  onSelectTicket: (ticket: Ticket) => void
  onDeleteTicket: (id: string) => void
}

export function TicketList({ tickets, selectedTicket, onSelectTicket, onDeleteTicket }: TicketListProps) {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this ticket?")) return

    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete ticket")

      onDeleteTicket(id)
    } catch (error) {
      console.error("Error deleting ticket:", error)
      alert("Failed to delete ticket. Please try again.")
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No tickets yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <div
          key={ticket._id}
          className={`group cursor-pointer rounded-lg border p-3 transition-colors ${
            selectedTicket?._id === ticket._id
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary hover:border-primary/50"
          }`}
          onClick={() => onSelectTicket(ticket)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <div className="font-mono text-sm font-semibold text-foreground">{ticket.plateNumber}</div>
              <div className="text-sm text-muted-foreground">{ticket.customerName}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => handleDelete(e, ticket._id!)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
