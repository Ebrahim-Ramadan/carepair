"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { 
  X, Shield, Sparkles, Palette, PenTool, Sofa, SprayCan,
  Wrench, PackageOpen, Check, ShoppingCart
} from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Service } from "@/lib/types"
import { services, serviceCategories } from "@/lib/services"
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [isAddingServices, setIsAddingServices] = useState(false)

  const filteredServices = services
    .filter(service => 
      (selectedCategory === 'all' || service.category === selectedCategory) && 
      (searchQuery === '' || 
        service.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.nameAr.includes(searchQuery))
    )

  // Group services by category for the tabs
  const servicesByCategory = serviceCategories.reduce((acc, category) => {
    acc[category.id] = filteredServices.filter(service => service.category === category.id)
    return acc
  }, {} as Record<string, Service[]>)

  // Get popular/recommended services (could be based on frequency or manually flagged)
  const popularServices = filteredServices.slice(0, 16) // Just using first few for example

  // Check if any services match the search query
  const hasSearchResults = searchQuery && filteredServices.length > 0

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'protection': return <Shield className="h-4 w-4" />
      case 'polish': return <Sparkles className="h-4 w-4" />
      case 'customization': return <Palette className="h-4 w-4" />
      case 'restoration': return <PenTool className="h-4 w-4" />
      case 'upholstery': return <Sofa className="h-4 w-4" />
      case 'cleaning': return <SprayCan className="h-4 w-4" />
      default: return <Wrench className="h-4 w-4" />
    }
  }

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
                <span className="text-xs text-muted-foreground pt-1.5">Selected:</span>
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

          {/* Main content area with guaranteed scrolling */}
          <div className="flex-1 overflow-hidden">
            {hasSearchResults ? (
              <div className="h-full overflow-y-auto p-6">
                <h3 className="text-sm font-medium mb-3">Search Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredServices.map(service => (
                    <ServiceCard 
                      key={service.id}
                      service={service}
                      isSelected={isServiceSelected(service.id)}
                      onToggleSelect={() => toggleServiceSelection(service)}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Tabs defaultValue="popular" className="h-full flex flex-col">
                <div className="px-6 py-2 border-b">
                  <TabsList className="w-full overflow-x-auto">
                    <TabsTrigger value="popular" className="flex items-center gap-2">
                      <PackageOpen className="h-4 w-4" />
                      <span>Popular</span>
                    </TabsTrigger>
                    {serviceCategories.map(category => (
                      <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                        {getCategoryIcon(category.id)}
                        <span>{category.nameEn}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="popular" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {popularServices.map(service => (
                          <ServiceCard 
                            key={service.id}
                            service={service}
                            isSelected={isServiceSelected(service.id)}
                            onToggleSelect={() => toggleServiceSelection(service)}
                            getCategoryIcon={getCategoryIcon}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {serviceCategories.map(category => (
                    <TabsContent 
                      key={category.id} 
                      value={category.id}
                      className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
                    >
                      <div className="flex-1 overflow-y-auto p-6">
                        {servicesByCategory[category.id]?.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {servicesByCategory[category.id].map(service => (
                              <ServiceCard 
                                key={service.id}
                                service={service}
                                isSelected={isServiceSelected(service.id)}
                                onToggleSelect={() => toggleServiceSelection(service)}
                                getCategoryIcon={getCategoryIcon}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No services in this category.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="px-6 py-4 border-t flex justify-between items-center bg-background">
            <div className="text-sm">
              <span>{selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected</span>
              {totalPrice > 0 && <span className="ml-2 font-medium">Total: {totalPrice} KD</span>}
            </div>
            <Button
              onClick={handleAddSelectedServices}
              disabled={selectedServices.length === 0 || isAddingServices}
              className="gap-2"
            >
              {isAddingServices ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Adding Services...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add Selected Services
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ServiceCard Component
type ServiceCardProps = {
  service: Service
  isSelected: boolean
  onToggleSelect: () => void
  getCategoryIcon: (categoryId: string) => JSX.Element
}

function ServiceCard({ service, isSelected, onToggleSelect, getCategoryIcon }: ServiceCardProps) {
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
          {isSelected ? (
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
              <Check className="h-3 w-3" />
            </div>
          ) : (
            getCategoryIcon(service.category)
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