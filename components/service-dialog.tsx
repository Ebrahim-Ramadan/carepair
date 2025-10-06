"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { X, Check, ShoppingCart } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import type { Service } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { DiscountType, ServiceWithDiscount } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [discountType, setDiscountType] = useState<DiscountType>('percentage')
  const [discountValue, setDiscountValue] = useState<number>(0)

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

  // Modify calculateFinalPrice to handle individual service prices
  const calculateFinalPrice = (originalPrice: number, isTotal: boolean = false) => {
    if (!discountValue) return originalPrice
    
    if (discountType === 'percentage') {
      return originalPrice - (originalPrice * (discountValue / 100))
    } else if (isTotal) {
      // Apply KWD discount to total price only
      return Math.max(0, originalPrice - discountValue)
    }
    // Return original price for individual services when using KWD discount
    return originalPrice
  }

  const totalPrice = selectedServices.reduce((total, service) => {
    if (typeof service.price === 'number') {
      return total + service.price
    }
    return total
  }, 0)

  // Calculate final total with consideration for discount type
  const finalTotalPrice = calculateFinalPrice(totalPrice, true)

  const handleAddSelectedServices = async () => {
    if (selectedServices.length === 0) return
    
    setIsAddingServices(true)
    
    try {
      const servicesWithDiscount: ServiceWithDiscount[] = selectedServices.map(service => ({
        ...service,
        discountType: discountValue > 0 ? discountType : undefined,
        discountValue: discountValue > 0 ? discountValue : undefined,
        // For KWD discount, store the proportional discount for each service
        finalPrice: discountType === 'percentage' 
          ? calculateFinalPrice(service.price)
          : service.price - ((discountValue / totalPrice) * service.price)
      }))
      
      const successfullyAddedServices: ServiceWithDiscount[] = []
      
      for (const service of servicesWithDiscount) {
        const success = await onAddService(service)
        if (success) {
          successfullyAddedServices.push(service)
        }
      }
      
      setSelectedServices([])
      onOpenChange(false)
      
      if (onServicesAdded && successfullyAddedServices.length > 0) {
        onServicesAdded(successfullyAddedServices)
      }
    } catch (error) {
      console.error('Error adding services:', error)
    } finally {
      setIsAddingServices(false)
    }
  }

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
                      discountType={discountType}
                      discountValue={discountValue}
                      totalPrice={totalPrice}
                      selectedServices={selectedServices}
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
          <div className="px-6 py-4 flex flex-col w-full border-t gap-4 bg-background">
            {selectedServices.length > 0 && (
              <div className="text-sm space-x-2">
                <span className="text-muted-foreground">Original: {totalPrice} KWD</span>
                {discountValue > 0 && (
                  <>
                    <span className="font-medium text-green-600">Final: {finalTotalPrice.toFixed(2)} KWD</span>
                    <span className="text-muted-foreground">
                      (Save: {(totalPrice - finalTotalPrice).toFixed(2)} KWD)
                    </span>
                  </>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex w-52 gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={discountType === 'percentage' ? 100 : undefined}
                      step={discountType === 'percentage' ? 1 : 0.1}
                      value={discountValue}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (discountType === 'percentage' && value > 100) {
                          setDiscountValue(100)
                        } else {
                          setDiscountValue(value)
                        }
                      }}
                      placeholder="Discount value"
                      className="w-24"
                    />
                    <Select
                      value={discountType}
                      onValueChange={(value: DiscountType) => setDiscountType(value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="amount">KWD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  
                </div>
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Update ServiceCard component
function ServiceCard({ 
  service, 
  isSelected, 
  onToggleSelect, 
  discountType, 
  discountValue,
  totalPrice,
  selectedServices 
}: ServiceCardProps) {
  const originalPrice = service.price
  const finalPrice = discountType === 'percentage'
    ? (discountValue ? originalPrice - (originalPrice * (discountValue / 100)) : originalPrice)
    : (discountValue && isSelected ? originalPrice - ((discountValue / totalPrice) * originalPrice) : originalPrice)

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
          {discountValue > 0 && isSelected ? (
            <div className="space-y-0.5">
              <span className="line-through text-muted-foreground">{originalPrice} KD</span>
              <span className="block font-semibold text-green-600">{finalPrice.toFixed(2)} KD</span>
              <span className="text-xs text-muted-foreground">
                {discountType === 'percentage' 
                  ? `${discountValue}% off`
                  : `${((discountValue / totalPrice) * originalPrice).toFixed(2)} KD off`}
              </span>
            </div>
          ) : (
            `${originalPrice} KD`
          )}
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