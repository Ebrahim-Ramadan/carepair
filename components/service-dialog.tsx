"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { X, Check, ShoppingCart } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import type { Service } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

type ServiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddService: (service: Service) => Promise<boolean | undefined>
  onServicesAdded?: (services: Service[]) => void // New callback prop
}

export function ServiceDialog({ 
  open, 
  onOpenChange, 
  onAddService, 
  onServicesAdded 
}: ServiceDialogProps) {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [isAddingServices, setIsAddingServices] = useState(false)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services')
        if (!response.ok) throw new Error('Failed to fetch services')
        const data = await response.json()
        setServices(data)
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [])

  const filteredServices = services.filter(service => 
    searchQuery === '' || 
    service.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.nameAr.includes(searchQuery)
  )

  const toggleServiceSelection = (service: Service) => {
    setSelectedServices(prevSelected => {
      const isAlreadySelected = prevSelected.some(s => s.id === service.id)
      if (isAlreadySelected) {
        return prevSelected.filter(s => s.id !== service.id)
      } else {
        return [...prevSelected, service]
      }
    })
  }

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId)
  }

  const handleAddSelectedServices = async () => {
    if (selectedServices.length === 0) return
    
    setIsAddingServices(true)
    
    try {
      // Add each selected service one by one
      const successfullyAddedServices: Service[] = []
      
      for (const service of selectedServices) {
        const success = await onAddService(service)
        if (success) {
          successfullyAddedServices.push(service)
        }
      }
      
      // Clear selection and close dialog
      setSelectedServices([])
      onOpenChange(false)
      
      // Call the callback if provided with successfully added services
      if (onServicesAdded && successfullyAddedServices.length > 0) {
        onServicesAdded(successfullyAddedServices)
      }
    } catch (error) {
      console.error('Error adding services:', error)
    } finally {
      setIsAddingServices(false)
    }
  }

  // Calculate total price of selected services
  const totalPrice = selectedServices.reduce((total, service) => {
    if (typeof service.price === 'number') {
      return total + service.price
    }
    return total
  }, 0)

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => {
      // Prevent closing dialog while adding services
      if (isAddingServices && !isOpen) return
      onOpenChange(isOpen)
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-3xl h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 flex flex-col">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold text-foreground">Add Services to Ticket</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            
            <div className="mt-4">
              <Input 
                placeholder="Search services..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full"
              />
            </div>

            {selectedServices.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground pt-1.5">{selectedServices.length} Selected:</span>
                {selectedServices.map(service => (
                  <Badge 
                    key={service.id} 
                    variant="secondary" 
                    className="px-2 py-1 flex items-center gap-1"
                    onClick={() => toggleServiceSelection(service)}
                  >
                    {service.nameEn}
                    <X className="h-3 w-3 ml-1 cursor-pointer" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner size="lg" />
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredServices.map(service => (
                    <ServiceCard 
                      key={service.id}
                      service={service}
                      isSelected={isServiceSelected(service.id)}
                      onToggleSelect={() => toggleServiceSelection(service)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No services found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="px-6 py-4 border-t flex justify-between items-center bg-background">
            <div className="text-sm">
              {totalPrice > 0 && <span className="ml-2 font-medium">Total: {totalPrice} KWD</span>}
            </div>
            <Button
              onClick={handleAddSelectedServices}
              disabled={selectedServices.length === 0 || isAddingServices}
              className="gap-2"
            >
              {isAddingServices ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add 
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Simplified ServiceCard Component
function ServiceCard({ service, isSelected, onToggleSelect }: Omit<ServiceCardProps, 'getCategoryIcon'>) {
  return (
    <div 
      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
        isSelected 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:bg-accent/50'
      }`}
      onClick={onToggleSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSelected && (
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
              <Check className="h-3 w-3" />
            </div>
          )}
          <h3 className="font-medium">{service.nameEn}</h3>
        </div>
        <div className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
          {typeof service.price === 'number' ? `${service.price} KD` : service.price}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{service.nameAr} - {service.descriptionAr}</p>
      <div className="mt-2 text-xs text-right text-muted-foreground">
        Est. time: {service.estimatedHours} {service.estimatedHours === 1 ? 'hour' : 'hours'}
      </div>
      <div className="mt-1 text-xs text-muted-foreground rtl:text-right">
         {service.descriptionEn}
      </div>
    </div>
  )
}