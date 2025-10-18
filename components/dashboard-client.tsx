"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { TicketForm } from "@/components/ticket-form"
import { TicketList } from "@/components/ticket-list"
import { TicketView } from "@/components/ticket-view"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { 
  Plus,  X,  ChevronLeft, 
  ChevronRight
} from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import type { Ticket, TicketSummary, Service, ServiceWithDiscount } from "@/lib/types"
import LoadingDots from "./ui/loading-spinner"

// Dynamically import the ServiceDialog component
const ServiceDialog = dynamic(() => import("@/components/service-dialog").then(mod => mod.ServiceDialog), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg border border-border bg-card p-6 shadow-xl">
        <Spinner size="lg" />
      </div>
    </div>
  ),
  ssr: false // We don't need this component for SSR
})

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
  const [isAddingService, setIsAddingService] = useState(false)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [deletingServiceIds, setDeletingServiceIds] = useState<string[]>([])
  const ticketViewRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null) // Add ref for services section

  // Load ticket from URL parameter on mount
  useEffect(() => {
    if (ticketIdParam && !selectedTicket) {
      const ticketFromList = tickets.find(t => t._id === ticketIdParam)
      if (ticketFromList) {
        handleSelectTicket(ticketFromList as Ticket)
      }
    }
  }, [ticketIdParam, tickets])

  // Check for hash in URL and scroll to services section
  useEffect(() => {
    if (window.location.hash === '#services' && servicesRef.current) {
      setTimeout(() => {
        servicesRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 500) // Small delay to ensure content is rendered
    }
  }, [selectedTicket]) // Re-run when selected ticket changes

  const handleScrollToServices = () => {
    if (servicesRef.current) {
      // Update URL with hash
      const url = new URL(window.location.href)
      url.hash = 'services'
      window.history.replaceState({}, '', url.toString())
      
      // Scroll to services section
      servicesRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
      url.hash = '' // Clear hash as well
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
      console.log('res', res);
      
      if (res.status === 404) {
        console.log('ass');
        
        toast.error('Ticket not found. It may have been deleted.')
        // Remove ticket from the list if it's not found
        setTickets(tickets.filter(t => t._id !== maybeTicket._id))
        setSelectedTicket(null)
        // Update URL to remove the ticket ID
        const url = new URL(window.location.href)
        url.searchParams.delete("ticketId")
        url.hash = ''
        router.replace(url.toString())
        return
      }
      
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
      console.error('ass:', e)
      console.error(e)
    } finally {
      setIsLoadingTicket(false)
    }
  }


  const handleAddService = async (service: ServiceWithDiscount) => {
    if (!selectedTicket || !selectedTicket._id) {
      toast.error('No ticket selected')
      return false
    }

    try {
      const response = await fetch(`/api/tickets/${selectedTicket._id}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.nameEn,
          serviceNameAr: service.nameAr,
          price: service.price,
          category: service.category,
          descriptionEn: service.descriptionEn,
          descriptionAr: service.descriptionAr,
          addedAt: new Date().toISOString(),
          isCustom: service.isCustom || false,
          // Add discount information
          discountType: service.discountType,
          discountValue: service.discountValue,
          finalPrice: service.finalPrice
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add service to ticket')
      }

      const updatedTicket = await response.json()
      setSelectedTicket(updatedTicket)
      
      return true
    } catch (error) {
      console.error('Error adding service:', error)
      toast.error(`Failed to add service: ${service.nameEn}`)
      return false
    }
  }

  const handleRemoveService = async (serviceId: string) => {
    if (!selectedTicket || !selectedTicket._id) return
    
    // Add service ID to loading state
    setDeletingServiceIds(prev => [...prev, serviceId])
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Removing service...')
      
      const response = await fetch(`/api/tickets/${selectedTicket._id}/services/${serviceId}`, {
        method: 'DELETE',
      })
      
      // Dismiss loading toast
      toast.dismiss(loadingToast)
      
      if (!response.ok) {
        throw new Error('Failed to remove service')
      }
      
      const updatedTicket = await response.json()
      setSelectedTicket(updatedTicket)
      toast.success('Service removed from ticket')
    } catch (error) {
      console.error('Error removing service:', error)
      toast.error('Failed to remove service')
    } finally {
      // Remove service ID from loading state whether successful or not
      setDeletingServiceIds(prev => prev.filter(id => id !== serviceId))
    }
  }

  // Function to scroll down to services after adding them from the dialog
  const handleAddSelectedServices = async (services: Service[]) => {
    // Services are added, now add hash and scroll
    setTimeout(() => {
      const url = new URL(window.location.href)
      url.hash = 'services'
      window.history.replaceState({}, '', url.toString())
      
      if (servicesRef.current) {
        servicesRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 500) // Small delay to ensure the services are rendered
  }

  return (
    <div className="min-h-screen mt-2">
      {/* Main Content */}
      <div className="mx-auto px-2">
        <div className="grid gap-4 lg:grid-cols-[350px_1fr]">
          {/* Sidebar - Ticket List */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-neutral-50 p-4">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-1">
                  <h2 className="text-lg font-semibold text-foreground">Tickets</h2>
                  <p className="text-xs font-normal text-neutral-500">({total})</p>
                </div>
                <Button onClick={() => setIsCreating(true)} size="sm" className="bg-[#002540]">
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
                <span className="text-xs">Page {page} of {totalPages}</span>
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
              <div className="flex h-[600px] items-center justify-center rounded-lg border border-border ">
               <LoadingDots />
              </div>
            ) : selectedTicket ? (
                <TicketView 
                  ticket={selectedTicket} 
                  onUpdate={handleTicketUpdated}
                  onRemoveService={handleRemoveService}
                  deletingServiceIds={deletingServiceIds} 
                  servicesRef={servicesRef} // Pass the services ref to TicketView
                  onOpenAddService={() => setIsAddingService(true)}
                  onScrollToServices={handleScrollToServices}
                />
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-lg border border-dashed border-border ">
                <div className="text-center">
                  {/* <MousePointer2 className="mx-auto text-[#EC653B]"/> */}
                  <svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" className="mx-auto text-[#EC653B]" >
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.02174 4.76932C6.11625 2.33698 9.8838 2.33698 11.9783 4.76932L14.7603 7.99999L13.6664 9.27031L14.6934 10.3764L16.3184 8.48938V7.5106L13.115 3.79054C10.422 0.663244 5.57803 0.663247 2.88509 3.79054L-0.318298 7.5106V8.48938L2.88509 12.2094C4.7342 14.3568 7.59749 15.0297 10.0822 14.2281L8.9183 12.9747C7.16767 13.2832 5.28865 12.7019 4.02174 11.2307L1.23978 7.99999L4.02174 4.76932ZM8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6ZM4.5 8C4.5 6.067 6.067 4.5 8 4.5C9.933 4.5 11.5 6.067 11.5 8C11.5 8.63488 11.331 9.23028 11.0354 9.74364L14.0496 12.9897L14.5599 13.5393L13.4607 14.5599L12.9504 14.0103L10.0223 10.857C9.4512 11.262 8.7534 11.5 8 11.5C6.067 11.5 4.5 9.933 4.5 8Z" fill="currentColor"></path>
                  </svg>
                  <p className="mt-2 text-xs  text-[#002540]">
                    Select a ticket from the list or create a new one
                  </p>
                  {/* Show hint on mobile */}
                  <p className="mt-2 text-xs lg:hidden">
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
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-neutral-50 p-6 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
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

      {/* Dynamically loaded service dialog */}
      {isAddingService && (
        <ServiceDialog 
          open={isAddingService}
          onOpenChange={setIsAddingService}
          onAddService={handleAddService}
          onServicesAdded={handleAddSelectedServices}
        />
      )}
    </div>
  )
}