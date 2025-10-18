"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Calendar, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import type { Ticket, TicketSummary } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

type TicketListProps = {
  tickets: TicketSummary[]
  selectedTicket: Ticket | null
  onSelectTicket: (ticket: Ticket) => void
  onDeleteTicket: (id: string) => void
}

export function TicketList({ tickets, selectedTicket, onSelectTicket, onDeleteTicket }: TicketListProps) {
  const [isExporting, setIsExporting] = useState(false)

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

  if (tickets.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No tickets yet</p>
      </div>
    )
  }

  return (
    <div>
     

      <div className="space-y-2">
        {tickets.map((ticket) => (
          <div
            key={ticket._id}
            className={`group cursor-pointer rounded-lg border p-3 transition-colors ${
              selectedTicket?._id === ticket._id
                ? "border-neutral-200 bg-primary/10"
                : "border-border bg-secondary hover:border-primary/50"
            }`}
            onClick={() => onSelectTicket({ _id: ticket._id } as unknown as Ticket)}
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
