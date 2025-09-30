"use client"

import { useState } from "react"
import { TicketForm } from "@/components/ticket-form"
import { TicketList } from "@/components/ticket-list"
import { TicketView } from "@/components/ticket-view"
import { Button } from "@/components/ui/button"
import { Plus, FileText, X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import type { Ticket } from "@/lib/types"

type DashboardClientProps = {
  initialTickets: Ticket[]
}

export function DashboardClient({ initialTickets }: DashboardClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isCreating, setIsCreating] = useState(false)
console.log('initialTickets', initialTickets);

  const handleTicketCreated = (ticket: Ticket) => {
    setTickets([ticket, ...tickets])
    setIsCreating(false)
    setSelectedTicket(ticket)
  }

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets(tickets.map((t) => (t._id === updatedTicket._id ? updatedTicket : t)))
    setSelectedTicket(updatedTicket)
  }

  const handleTicketDeleted = (id: string) => {
    setTickets(tickets.filter((t) => t._id !== id))
    if (selectedTicket?._id === id) {
      setSelectedTicket(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>  
              <div>
                <h1 className="text-xl font-semibold text-foreground">Car Service Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage vehicle service tickets</p>
              </div>
            </div>
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Sidebar - Ticket List */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Tickets</h2>
              <TicketList
                tickets={tickets}
                selectedTicket={selectedTicket}
                onSelectTicket={setSelectedTicket}
                onDeleteTicket={handleTicketDeleted}
              />
            </div>
          </div>

          {/* Main Area */}
          <div>
            {selectedTicket ? (
              <TicketView ticket={selectedTicket} onUpdate={handleTicketUpdated} />
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-lg border border-dashed border-border bg-card">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">No ticket selected</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a ticket from the list or create a new one
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
