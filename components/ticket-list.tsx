"use client"

import React, { useState, useEffect, useMemo } from "react"
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

export function TicketList({
  tickets,
  selectedTicket,
  onSelectTicket,
  onDeleteTicket,
}: TicketListProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [filterOption, setFilterOption] = useState<
    "all" | "7days" | "month" | "6months" | "year" | "custom"
  >("all")
  const [customStart, setCustomStart] = useState<string | null>(null)
  const [customEnd, setCustomEnd] = useState<string | null>(null)
  const [updatingCheckup, setUpdatingCheckup] = useState<string | null>(null)

  // Sort helper (must be declared before use)
  const sortTickets = (src: TicketSummary[]) =>
    [...(src || [])].sort((a, b) => {
      const getTime = (t: TicketSummary) => {
        const dateStr = t.invoiceDate || t.createdAt
        return dateStr ? new Date(dateStr).getTime() : 0
      }
      return getTime(b) - getTime(a)
    })

  const [localTickets, setLocalTickets] = useState<TicketSummary[]>(() => sortTickets(tickets))

  // Sync local tickets when prop changes
  useEffect(() => {
    setLocalTickets(sortTickets(tickets))
  }, [tickets])

  // Filtered & limited tickets (max 10 shown)
  const displayedTickets = useMemo(() => {
    const now = new Date()
    let start: Date | null = null
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (filterOption === "7days") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      start.setHours(0, 0, 0, 0)
    } else if (filterOption === "month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      start.setHours(0, 0, 0, 0)
    } else if (filterOption === "6months") {
      start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      start.setHours(0, 0, 0, 0)
    } else if (filterOption === "year") {
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      start.setHours(0, 0, 0, 0)
    } else if (filterOption === "custom" && customStart) {
      start = new Date(customStart)
      start.setHours(0, 0, 0, 0)
      if (customEnd) {
        end = new Date(customEnd)
        end.setHours(23, 59, 59, 999)
      }
    }

    const filtered = localTickets.filter((t) => {
      const dateStr = t.invoiceDate || t.createdAt
      if (!dateStr) return false
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return false
      if (start && d < start) return false
      if (d > end) return false
      return true
    })

    return filtered.slice(0, 10)
  }, [localTickets, filterOption, customStart, customEnd])

  // Listen for checkup status changes from other components
  useEffect(() => {
    const handleCheckupUpdate = (data: { ticketId: string; isCheckup: boolean }) => {
      setLocalTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === data.ticketId ? { ...ticket, isCheckup: data.isCheckup } : ticket
        )
      )
    }

    ticketEventEmitter.on("checkup-updated", handleCheckupUpdate)
    return () => ticketEventEmitter.off("checkup-updated", handleCheckupUpdate)
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this ticket?")) return

    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Ticket deleted")
      onDeleteTicket(id)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete ticket")
    }
  }

  const handleCheckupToggle = async (
    e: React.MouseEvent,
    id: string,
    current: boolean
  ) => {
    e.stopPropagation()
    setUpdatingCheckup(id)

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCheckup: !current }),
      })
      if (!res.ok) throw new Error("Update failed")

      ticketEventEmitter.emit("checkup-updated", { ticketId: id, isCheckup: !current })
      toast.success(!current ? "Checkup marked" : "Checkup unmarked")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update checkup status")
    } finally {
      setUpdatingCheckup(null)
    }
  }

  const handleExportAll = async () => {
    setIsExporting(true)
    try {
      const res = await fetch("/api/tickets/all")
      if (!res.ok) throw new Error("Export fetch failed")
      const allTickets: Ticket[] = await res.json()

      const XLSX = await import("xlsx")

      const rows = allTickets.map((t) => ({
        TicketID: String(t._id ?? ""),
        Plate: String(t.plateNumber ?? ""),
        Customer: String(t.customerName ?? ""),
        Phone: String(t.customerPhone ?? ""),
        Date: t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
        Total: Number(t.totalAmount ?? 0),
        Services: (t.services ?? [])
          .map((s) => {
            const name = [s.serviceName, s.serviceNameAr].filter(Boolean).join(" / ")
            const price = Number(s.finalPrice ?? s.price ?? 0).toFixed(3)
            return `${name} - ${price} KWD`
          })
          .join("; "),
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, "Tickets")
      const filename = `tickets-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`
      XLSX.writeFile(wb, filename)

      toast.success("Exported successfully")
    } catch (err) {
      console.error(err)
      toast.error("Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  if (localTickets.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No tickets found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <label className="sr-only">Date range</label>
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="7days">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="6months">Last 6 months</option>
            <option value="year">Last 12 months</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {filterOption === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart ?? ""}
              onChange={(e) => setCustomStart(e.target.value || null)}
              className="text-sm border rounded px-2 py-1"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd ?? ""}
              onChange={(e) => setCustomEnd(e.target.value || null)}
              className="text-sm border rounded px-2 py-1"
            />
            <Button size="sm" variant="secondary" onClick={() => setFilterOption("custom")}>
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilterOption("all")
                setCustomStart(null)
                setCustomEnd(null)
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Ticket list */}
      <div className="space-y-2">
        {displayedTickets.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No tickets match the selected filter
          </div>
        ) : (
          displayedTickets.map((ticket) => {
            const isSelected = selectedTicket?._id === ticket._id
            const date = new Date(ticket.invoiceDate || ticket.createdAt)

            return (
              <div
                key={ticket._id}
                onClick={() => onSelectTicket({ _id: ticket._id } as unknown as Ticket)}
                className={`group relative rounded-lg border p-3.5 cursor-pointer transition-all
                  ${isSelected
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "bg-card hover:border-primary/30 hover:shadow-sm"}`}
              >
                {isSelected && (
                  <div className="absolute -top-1 -left-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary" />
                    <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-primary animate-ping" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className={`font-medium ${isSelected ? "text-lg text-primary" : "text-base"}`}>
                      {ticket.invoiceNo}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {ticket.customerName || "—"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {date.toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleCheckupToggle(e, ticket._id, ticket.isCheckup ?? false)}
                      disabled={updatingCheckup === ticket._id}
                      title={ticket.isCheckup ? "Unmark as checkup" : "Mark as checkup"}
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
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(e, ticket._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Export */}
      <div className="flex justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAll}
          disabled={isExporting || localTickets.length === 0}
        >
          {isExporting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export All to Excel
            </>
          )}
        </Button>
      </div>
    </div>
  )
}