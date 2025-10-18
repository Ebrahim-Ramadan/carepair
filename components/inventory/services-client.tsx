"use client"

import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Render services grouped by category instead of a flat table
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { ServiceDialog } from "./service-dialog"
import { toast } from "sonner"

type ServiceCategory = 'protection' | 'tanting' | 'painting' | 'detailing' | 'repair'

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
  // Export to PDF
  const handleExportPDF = async () => {
    const doc = new jsPDF()
    // Embed Amiri font for Arabic
    try {
      const response = await fetch('/fonts/base64.txt');
      const amiriFontData = await response.text();
      doc.addFileToVFS('Amiri-Regular.ttf', amiriFontData);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    } catch (e) {}
    doc.text("Services", 14, 12)
    autoTable(doc, {
      head: [["Name (EN)", "Name (AR)", "Category", "Price (KWD)"]],
      body: services.map((s) => [
        s.nameEn,
        s.nameAr,
        s.category,
        typeof s.price === "number" ? s.price.toFixed(3) : "",
      ]),
      styles: (data) => {
        if (data.column.index === 1) {
          return { font: 'Amiri' }
        }
        return { font: 'helvetica' }
      }
    })
    doc.save("services.pdf")
  }

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      services.map((s) => ({
        "Name (EN)": s.nameEn,
        "Name (AR)": s.nameAr,
        Category: s.category,
        "Price (KWD)": typeof s.price === "number" ? s.price.toFixed(3) : "",
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Services")
    XLSX.writeFile(wb, "services.xlsx")
  }
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

      <div className="flex items-center justify-end">
        {/* <h1 className="text-2xl font-bold">Services Management</h1> */}
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>Export PDF</Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>Export Excel</Button>
          <Button onClick={() => setIsDialogOpen(true)} size='sm'>
            <Plus className="w-2 h-2" />
            Add 
          </Button>
        </div>
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

      <div className="space-y-6">
        {/* Build a list of categories from the filtered services */}
        {(() => {
          // Fixed ordered categories (from the type definition)
          const orderedCategories: ServiceCategory[] = [
            'protection',
            'tanting',
            'painting',
            'detailing',
            'repair'
          ]

          // Map of category -> Tailwind bg class to visually specialize each section
          const categoryBg: Record<ServiceCategory, string> = {
            protection: 'bg-green-50',
            tanting: 'bg-yellow-50',
            painting: 'bg-red-50',
            detailing: 'bg-blue-50',
            repair: 'bg-gray-50'
          }

          const categoriesToShow = selectedCategory === 'all' ? orderedCategories : [selectedCategory as ServiceCategory]

          return categoriesToShow.map((category) => {
            const categoryServices = filteredServices.filter(s => s.category === category)

            return (
              <section key={category} className={`rounded-lg border p-4 ${categoryBg[category]}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold capitalize">{category}</h3>
                  <span className="text-sm text-muted-foreground">{categoryServices.length} items</span>
                </div>

                {categoryServices.length === 0 ? (
                  <div className="p-6 rounded-md border border-dashed text-center text-sm text-muted-foreground">
                    No services in this category
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryServices.map((service, idx) => (
                      <div key={service._id} className="border rounded-md p-3 flex flex-col justify-between">
                        <div className="flex items-start gap-3">
                          <div className="text-muted-foreground font-medium w-6 text-right">{idx + 1}.</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{service.nameEn}</h4>
                                <p className="text-sm text-muted-foreground font-arabic">{service.nameAr}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{service.price} KWD</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })
        })()}
      </div>
    </div>
  )
}