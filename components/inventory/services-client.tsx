"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { ServiceDialog } from "./service-dialog"
import { toast } from "sonner"

type ServiceCategory = 'protection' | 'tinting' | 'painting' | 'detailing' | 'repair'

type Service = {
  _id: string
  id: string
  nameEn: string
  nameAr: string
  // descriptionEn: string
  // descriptionAr: string
  price: number
  category: ServiceCategory
}

type ServicesClientProps = {
  initialServices: Service[]
}

export function ServicesClient({ initialServices }: ServicesClientProps) {
  const [services, setServices] = useState(initialServices)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all')


  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameAr.includes(searchQuery) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleCreateService = async (serviceData: Partial<Service>) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/inventory/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      })

      if (!res.ok) throw new Error('Failed to create service')
      
      const newService = await res.json()
      setServices(prev => [...prev, newService])
      setIsDialogOpen(false)
      toast.success('Service created successfully')
    } catch (error) {
      toast.error('Failed to create service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateService = async (serviceData: Partial<Service>) => {
    if (!editingService?._id) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/inventory/services/${editingService._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      })

      if (!res.ok) throw new Error('Failed to update service')
      
      const updated = await res.json()
      setServices(prev => prev.map(s => s._id === updated._id ? updated : s))
      setEditingService(null)
      toast.success('Service updated successfully')
    } catch (error) {
      toast.error('Failed to update service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/inventory/services/${serviceId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete service')
      
      setServices(prev => prev.filter(s => s._id !== serviceId))
      toast.success('Service deleted successfully')
    } catch (error) {
      toast.error('Failed to delete service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (serviceData: Partial<Service>) => {
    if (editingService) {
      await handleUpdateService(serviceData)
    } else {
      await handleCreateService(serviceData)
    }
  }

  return (
    <div className="p-2 space-y-2">
      <ServiceDialog 
        open={isDialogOpen || !!editingService}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingService(null)
        }}
        // Pass the full editing service object
        service={editingService ?? undefined}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add 
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map(service => (
              <TableRow key={service._id}>
                <TableCell>{service.nameEn}</TableCell>
                <TableCell className="font-arabic">{service.nameAr}</TableCell>
                <TableCell className="capitalize">{service.category}</TableCell>
                <TableCell>{service.price} KWD</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingService(service)}
                    disabled={isLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteService(service._id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}