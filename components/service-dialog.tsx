"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { X, Check, ShoppingCart, Pen } from "lucide-react"
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
  onAddService: (service: ServiceWithDiscount) => Promise<boolean | undefined>
  onServicesAdded?: (services: ServiceWithDiscount[]) => void
}

type ServiceCardProps = {
  service: Service
  isSelected: boolean
  onToggleSelect: () => void
  onCustomPrice: (price: number) => void
  customPrices: Record<string, number>
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customServiceCategory, setCustomServiceCategory] = useState<string | null>(null)
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})
  
  // Dynamically get unique categories from services
  const categories = Array.from(new Set(services.map(service => service.category)))

  // Handle custom price for a service
  const handleCustomPrice = (service: Service, price: number) => {
    setCustomPrices(prev => ({
      ...prev,
      [service.id]: price
    }))
  }

  // Get service price as a number (custom overrides default for display only)
  const getServicePrice = (service: Service): number => {
    // If there's a custom price, use that for calculations
    if (typeof customPrices[service.id] === 'number') {
      return customPrices[service.id]
    }
    // Otherwise use the original price
    const originalPrice = typeof service.price === 'string' ? parseFloat(service.price) : service.price
    return originalPrice
  }

  // Calculate total price of selected services
  const totalPrice = selectedServices.reduce((total, service) => total + getServicePrice(service), 0)

  // Calculate final price for a given original price
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

  // Calculate final total with consideration for discount type
  const finalTotalPrice = calculateFinalPrice(totalPrice, true)

  // Create a custom service
  const handleCreateCustomService = async (data: { nameEn: string; nameAr: string; price: number }) => {
    try {
      const customService: Service = {
        id: `custom-${Date.now()}`,
        ...data,
        category: customServiceCategory!,
        isCustom: true,
        descriptionEn: "",
        descriptionAr: "",
      }
      
      // Add to services list
      setServices(prev => [...prev, customService])
      // Auto-select the custom service
      setSelectedServices(prev => [...prev, customService])
      // Reset custom service form
      setCustomServiceCategory(null)
    } catch (error) {
      console.error('Error creating custom service:', error)
    }
  }

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

  const filteredServices = services.filter(service => {
    const matchesSearch = searchQuery === '' || 
      service.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameAr.includes(searchQuery)
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

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
      const servicesWithDiscount: ServiceWithDiscount[] = selectedServices.map(service => {
        const originalPrice = getServicePrice(service)
        let finalPrice: number
        if (discountType === 'percentage') {
          finalPrice = calculateFinalPrice(originalPrice, false)
        } else {
          // Proportional KWD discount for each service
          finalPrice = Math.max(0, originalPrice - ((discountValue / totalPrice) * originalPrice))
        }

        // Keep original price but add finalPrice for this instance
        return {
          ...service,
          price: originalPrice, // keep original price
          discountType: discountValue > 0 ? discountType : undefined,
          discountValue: discountValue > 0 ? discountValue : undefined,
          finalPrice: finalPrice // use custom/discounted price as finalPrice
        }
      })
      
      const successfullyAddedServices: ServiceWithDiscount[] = []
      
      for (const service of servicesWithDiscount) {
        const success = await onAddService(service)
        if (success) {
          successfullyAddedServices.push(service)
        }
      }
      
      setSelectedServices([])
      setCustomPrices({})
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
    <>
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
              
              <div className="mt-4 space-y-4">
                <Input 
                  placeholder="Search services..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full"
                />
                
                {categories.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    <Button
                      variant={selectedCategory === 'all' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                    >
                      All 
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="capitalize whitespace-nowrap"
                      >
                        {category}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({services.filter(s => s.category === category).length})
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedServices.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground pt-1.5">{selectedServices.length} Selected:</span>
                  {selectedServices.map(service => (
                    <Badge 
                      key={service.id} 
                      variant="secondary" 
                      className="px-2 py-1 flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleServiceSelection(service)
                      }}
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
                ) : (
                  <div className="space-y-6">
                    {(selectedCategory === 'all' ? categories : [selectedCategory]).map(category => {
                      const categoryServices = filteredServices.filter(s => 
                        selectedCategory === 'all' ? s.category === category : s.category === selectedCategory
                      )
                      if (categoryServices.length === 0) return null
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold capitalize">{category}</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomServiceCategory(category)}
                            >
                              Add Custom Service
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryServices.map(service => (
                              <ServiceCard 
                                key={service.id}
                                service={service}
                                isSelected={isServiceSelected(service.id)}
                                onToggleSelect={() => toggleServiceSelection(service)}
                                onCustomPrice={(price) => handleCustomPrice(service, price)}
                                customPrices={customPrices}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="px-6 py-4 flex flex-col w-full border-t gap-4 bg-background">
              {selectedServices.length > 0 && (
                <div className="text-sm space-x-2">
                  <span className="text-muted-foreground">Original: {totalPrice.toFixed(2)} KWD</span>
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

      {/* Custom Service Dialog */}
      <Dialog.Root open={!!customServiceCategory} onOpenChange={(open) => !open && setCustomServiceCategory(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                Add Custom Service
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              await handleCreateCustomService({
                nameEn: formData.get('nameEn') as string,
                nameAr: formData.get('nameAr') as string,
                price: Number(formData.get('price'))
              })
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input id="nameEn" name="nameEn" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input id="nameAr" name="nameAr" required dir="rtl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (KWD)</Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  step="0.001" 
                  min="0" 
                  required 
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCustomServiceCategory(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Service
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

// ServiceCard component
function ServiceCard({ 
  service, 
  isSelected, 
  onToggleSelect, 
  onCustomPrice,
  customPrices
}: ServiceCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const originalPrice = customPrices[service.id] ?? service.price

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
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{service.nameEn}</h3>
            {service.isCustom && (
              <Badge variant="outline" className="text-xs">
                Custom
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const price = Number((e.target as HTMLFormElement).price.value)
                onCustomPrice(price)
                setIsEditing(false)
              }}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1"
            >
              <Input
                name="price"
                type="number"
                step="0.001"
                min="0"
                defaultValue={originalPrice}
                className="w-20 h-6 text-xs"
                autoFocus
                onBlur={(e) => {
                  if (e.target.value) {
                    onCustomPrice(Number(e.target.value))
                  }
                  setIsEditing(false)
                }}
              />
              <span className="text-xs">KD</span>
            </form>
          ) : (
            <div 
              className="bg-primary/10 flex flex-row items-center text-primary rounded-full px-2 py-1 text-xs font-medium cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              {originalPrice.toFixed(2)} KD {customPrices[service.id] && (
                <Pen className="w-3 h-3 ml-1 " />
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{service.nameAr} - {service.descriptionAr}</p>

      <div className="mt-1 text-xs text-muted-foreground rtl:text-right">
         {service.descriptionEn}
      </div>
    </div>
  )
}