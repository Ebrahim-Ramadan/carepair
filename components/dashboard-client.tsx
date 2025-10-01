"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TicketForm } from "@/components/ticket-form"
import { TicketList } from "@/components/ticket-list"
import { TicketView } from "@/components/ticket-view"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Plus, FileText, X, ArrowBigLeft, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import type { Ticket, TicketSummary } from "@/lib/types"

type DashboardClientProps = {
  initialTickets: TicketSummary[]
  page?: number
  totalPages?: number
  total: number
}

export function DashboardClient({ initialTickets, page = 1, totalPages = 1, total }: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticketIdParam = searchParams.get("ticketId")
  
  const [tickets, setTickets] = useState<TicketSummary[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const ticketViewRef = useRef<HTMLDivElement>(null)

  // Load ticket from URL parameter on mount
  useEffect(() => {
    if (ticketIdParam && !selectedTicket) {
      const ticketFromList = tickets.find(t => t._id === ticketIdParam)
      if (ticketFromList) {
        handleSelectTicket(ticketFromList as Ticket)
      }
    }
  }, [ticketIdParam, tickets])

  const handleTicketCreated = (ticket: Ticket) => {
    setTickets([
      { _id: ticket._id!, plateNumber: ticket.plateNumber, customerName: ticket.customerName, createdAt: new Date(ticket.createdAt).toISOString() },
      ...tickets,
    ])
    setIsCreating(false)
    setSelectedTicket(ticket)
    
    // Update URL with new ticket ID
    const url = new URL(window.location.href)
    url.searchParams.set("ticketId", ticket._id!)
    router.replace(url.toString())
  }

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets(tickets.map((t) => (t._id === updatedTicket._id ? { _id: updatedTicket._id!, plateNumber: updatedTicket.plateNumber, customerName: updatedTicket.customerName, createdAt: new Date(updatedTicket.createdAt).toISOString() } : t)))
    setSelectedTicket(updatedTicket)
  }

  const handleTicketDeleted = (id: string) => {
    setTickets(tickets.filter((t) => t._id !== id))
    if (selectedTicket?._id === id) {
      setSelectedTicket(null)
      // Remove ticket ID from URL when ticket is deleted
      const url = new URL(window.location.href)
      url.searchParams.delete("ticketId")
      router.replace(url.toString())
    }
  }

  const handleSelectTicket = async (maybeTicket: Ticket) => {
    try {
      if (!maybeTicket._id) return

      // Update URL immediately when ticket is selected
      const url = new URL(window.location.href)
      url.searchParams.set("ticketId", maybeTicket._id)
      router.replace(url.toString())

      // If selection is already the same full ticket, skip API call but still update URL
      if (selectedTicket?._id === maybeTicket._id && selectedTicket?.customerPhone) {
        return
      }

      setIsLoadingTicket(true)
      const res = await fetch(`/api/tickets/${maybeTicket._id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch ticket')
      const full = await res.json()
      setSelectedTicket(full)
      
      // Scroll to ticket view on mobile screens
      if (window.innerWidth < 1024 && ticketViewRef.current) {
        ticketViewRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingTicket(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedTicket(null)
    // Remove ticket ID from URL
    const url = new URL(window.location.href)
    url.searchParams.delete("ticketId")
    router.replace(url.toString())
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className=" mx-auto px-2">
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Sidebar - Ticket List */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between pb-2">
               <div className=" flex items-center gap-1">
                 <h2 className="text-lg font-semibold text-foreground">Tickets 
              </h2>
<p className="text-xs font-normal text-neutral-500">
              ({total}) 
</p>
               </div>
               <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="w-3" />
              New 
            </Button>
            </div>
              <TicketList
                tickets={tickets}
                selectedTicket={selectedTicket}
                onSelectTicket={handleSelectTicket}
                onDeleteTicket={handleTicketDeleted}
              />
              <div className="mt-4 flex items-center justify-between">
                <a
                  href={`/?page=${Math.max(1, page - 1)}`}
                  className={`text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "text-primary hover:underline"}`}
                  aria-disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </a>
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <a
                  href={`/?page=${Math.min(totalPages, page + 1)}`}
                  className={`text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "text-primary hover:underline"}`}
                  aria-disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div ref={ticketViewRef} className="lg:min-h-0">
            {isLoadingTicket ? (
              <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-card">
                <div className="text-center">
                  <Spinner size="lg" className="mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Loading ticket...</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please wait while we fetch the ticket details
                  </p>
                </div>
              </div>
            ) : selectedTicket ? (
              <div className="space-y-4">
                {/* Back button for mobile */}
                <div className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to list
                  </Button>
                </div>
                <TicketView ticket={selectedTicket} onUpdate={handleTicketUpdated} />
              </div>
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-lg border border-dashed border-border bg-card">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Hi.</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a ticket from the list or create a new one
                  </p>
                  {/* Show hint on mobile */}
                  <p className="mt-2 text-xs text-muted-foreground lg:hidden">
                    Tap a ticket above to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Dialog.Root open={isCreating} onOpenChange={setIsCreating}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold text-foreground">Create New Ticket</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <TicketForm onSuccess={handleTicketCreated} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
