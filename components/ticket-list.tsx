"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Calendar, FileSpreadsheet, CheckSquare, Square } from "lucide-react"
import { toast } from "sonner"
import type { Ticket, TicketSummary } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import { ticketEventEmitter } from "@/lib/event-emitter"

type TicketListProps = {
  tickets: TicketSummary[]
  selectedTicket: Ticket | null
  onSelectTicket: (ticket: Ticket) => void
  onDeleteTicket: (id: string) => void
}

export function TicketList({ tickets, selectedTicket, onSelectTicket, onDeleteTicket }: TicketListProps) {
  console.log('TicketList, tickets', tickets);
  
  const [isExporting, setIsExporting] = useState(false)
  const [updatingCheckup, setUpdatingCheckup] = useState<string | null>(null)
  const [localTickets, setLocalTickets] = useState(tickets)

  // Sync with prop changes
  useEffect(() => {
    setLocalTickets(tickets)
  }, [tickets])

  // Listen for checkup updates from other components
  useEffect(() => {
    const handleCheckupUpdate = (data: { ticketId: string; isCheckup: boolean }) => {
      setLocalTickets(prev => 
        prev.map(ticket => 
          ticket._id === data.ticketId 
            ? { ...ticket, isCheckup: data.isCheckup }
            : ticket
        )
      )
    }

    ticketEventEmitter.on('checkup-updated', handleCheckupUpdate)
    
    return () => {
      ticketEventEmitter.off('checkup-updated', handleCheckupUpdate)
    }
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this ticket?")) return

    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete ticket")

      toast.success("Ticket deleted successfully!")
      onDeleteTicket(id)
    } catch (error) {
      console.error("Error deleting ticket:", error)
      toast.error("Failed to delete ticket. Please try again.")
    }
  }

  const handleCheckupToggle = async (e: React.MouseEvent, id: string, currentCheckup: boolean) => {
    e.stopPropagation()
    setUpdatingCheckup(id)
    
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCheckup: !currentCheckup }),
      })

      if (!response.ok) throw new Error("Failed to update checkup status")

      // Emit event for other components to sync
      ticketEventEmitter.emit('checkup-updated', { ticketId: id, isCheckup: !currentCheckup })

      toast.success(!currentCheckup ? "Checkup marked" : "Checkup unmarked")
    } catch (error) {
      console.error("Error updating checkup status:", error)
      toast.error("Failed to update checkup status. Please try again.")
    } finally {
      setUpdatingCheckup(null)
    }
  }

  const handleExportAllExcel = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/tickets/all')
      if (!res.ok) throw new Error('Failed to fetch tickets for export')
      const allTickets: Ticket[] = await res.json()

      const XLSX = await import('xlsx')
      const rows = allTickets.map(t => {
        // Flatten services into a single string: "ServiceName (EN) - FinalPrice KWD; ..."
        const servicesStr = (t.services ?? []).map(s => {
          const nameEn = String(s.serviceName ?? "")
          const nameAr = String(s.serviceNameAr ?? "")
          const final = typeof s.finalPrice === 'number' ? s.finalPrice : Number(s.finalPrice ?? s.price ?? 0)
          return `${nameEn}${nameAr ? ` / ${nameAr}` : ""} - ${final.toFixed(3)}`
        }).join("; ")

        return {
          TicketID: String(t._id ?? ""),
          PlateNumber: String(t.plateNumber ?? ""),
          CustomerName: String(t.customerName ?? ""),
          CustomerPhone: String(t.customerPhone ?? ""),
          CreatedAt: t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
          TotalAmount: typeof t.totalAmount === 'number' ? t.totalAmount : Number(t.totalAmount ?? 0),
          Services: servicesStr
        }
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Tickets')
      const filename = `tickets-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.xlsx`
      XLSX.writeFile(wb, filename)

      toast.success('Exported all tickets to Excel')
    } catch (err) {
      console.error('Error exporting tickets to Excel:', err)
      toast.error('Failed to export tickets')
    } finally {
      setIsExporting(false)
    }
  }

  if (localTickets.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No tickets yet</p>
      </div>
    )
  }

  return (
    <div>
     

      <div className="space-y-2">
        {localTickets.map((ticket) => (
          <div
            key={ticket._id}
            className={`relative group cursor-pointer rounded-lg border p-3 transition-colors ${
              selectedTicket?._id === ticket._id
                ? " border-neutral-200 bg-primary/10"
                : "border-border bg-secondary hover:border-primary/50"
            }`}
            onClick={() => onSelectTicket({ _id: ticket._id } as unknown as Ticket)}
          >
      {selectedTicket?._id === ticket._id && (
  <div className="absolute -top-1 -left-1">
    {/* Static inner circle */}
    <div className="w-3 h-3 rounded-full bg-[#002540]"></div>
    
    {/* Animated outer circle that fades away */}
    <div className="absolute top-0 left-0 w-3 h-3 rounded-full bg-[#002540] animate-ping"></div>
  </div>
)}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className={`font-mono  ${selectedTicket?._id === ticket._id ? "text-base font-bold text-[#002540]" : "text-sm font-semibold"}`}>{ticket.plateNumber}</div>
                <div className="text-sm text-muted-foreground">{ticket.customerName}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleCheckupToggle(e, ticket._id!, ticket.isCheckup || false)}
                  disabled={updatingCheckup === ticket._id}
                  title={ticket.isCheckup ? "Unmark checkup" : "Mark checkup"}
                >
                  {updatingCheckup === ticket._id ? (
                    <Spinner size="sm" />
                  ) : ticket.isCheckup ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleDelete(e, ticket._id!)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
       <div className="flex items-center justify-end py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAllExcel}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Spinner size="sm"/>
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
