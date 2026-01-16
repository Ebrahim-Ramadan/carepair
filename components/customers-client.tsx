"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

type Customer = {
  _id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  totalTickets: number
  lastVisit: string
  vehicles: Array<{
    plateNumber: string
    ticketId: string
  }>
}

function formatDate(value: string | Date) {
  const d = new Date(value)
  return d.toLocaleString()
}

type Category = {
  _id: string
  name: string
}

type FilterProps = {
  category?: string
  period?: string
  startDate?: string
  endDate?: string
}

type CustomersClientProps = {
  initialCustomers: Customer[]
  initialFilters?: FilterProps
}

export function CustomersClient({ initialCustomers, initialFilters }: CustomersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const prevCustomersRef = useRef<Customer[]>(initialCustomers)
  const isInitialMount = useRef(true)

  // Update customers when initialCustomers prop changes (e.g., after filter change)
  useEffect(() => {
    // Check if customers actually changed (compare by IDs or length/content)
    const hasChanged = 
      prevCustomersRef.current.length !== initialCustomers.length ||
      prevCustomersRef.current.some((prev, idx) => prev._id !== initialCustomers[idx]?._id)

    if (hasChanged || isInitialMount.current) {
      setCustomers(initialCustomers)
      prevCustomersRef.current = initialCustomers
      setIsLoading(false)
      isInitialMount.current = false
    }
  }, [initialCustomers])

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters?.category || 'all')
  const [datePeriod, setDatePeriod] = useState<string>(initialFilters?.period || 'all')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    initialFilters?.startDate ? new Date(initialFilters.startDate) : undefined
  )
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    initialFilters?.endDate ? new Date(initialFilters.endDate) : undefined
  )

  // Fetch categories when select opens
  useEffect(() => {
    if (categoryOpen && categories.length === 0) {
      setIsLoadingCategories(true)
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          setCategories(data)
          setIsLoadingCategories(false)
        })
        .catch(err => {
          console.error('Error fetching categories:', err)
          setIsLoadingCategories(false)
        })
    }
  }, [categoryOpen, categories.length])

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<FilterProps>) => {
    // Set loading immediately when filters change
    setIsLoading(true)
    
    const params = new URLSearchParams()
    
    const category = newFilters.category ?? selectedCategory
    const period = newFilters.period ?? datePeriod
    const startDate = newFilters.startDate ?? (customStartDate?.toISOString().split('T')[0])
    const endDate = newFilters.endDate ?? (customEndDate?.toISOString().split('T')[0])

    if (category && category !== 'all') {
      params.set('category', category)
    }
    if (period && period !== 'all') {
      params.set('period', period)
    }
    if (period === 'custom' && startDate) {
      params.set('startDate', startDate)
    }
    if (period === 'custom' && endDate) {
      params.set('endDate', endDate)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    updateFilters({ category: value })
  }

  // Handle date period change
  const handleDatePeriodChange = (value: string) => {
    setDatePeriod(value)
    
    // Auto-set dates for presets
    if (value === '7days') {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 7)
      setCustomStartDate(start)
      setCustomEndDate(end)
      updateFilters({ period: value, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] })
    } else if (value === 'month') {
      const end = new Date()
      const start = new Date()
      start.setMonth(end.getMonth() - 1)
      setCustomStartDate(start)
      setCustomEndDate(end)
      updateFilters({ period: value, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] })
    } else if (value === 'year') {
      const end = new Date()
      const start = new Date()
      start.setFullYear(end.getFullYear() - 1)
      setCustomStartDate(start)
      setCustomEndDate(end)
      updateFilters({ period: value, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] })
    } else if (value === 'custom') {
      // Keep existing dates or set defaults
      if (!customStartDate || !customEndDate) {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 7)
        setCustomStartDate(start)
        setCustomEndDate(end)
      }
      updateFilters({ period: value })
    } else if (value === 'all') {
      // Clear date filter
      setCustomStartDate(undefined)
      setCustomEndDate(undefined)
      updateFilters({ period: '' })
    }
  }

  // Handle custom date changes
  const handleStartDateChange = (date: Date | undefined) => {
    setCustomStartDate(date)
    if (date && customEndDate) {
      updateFilters({ 
        period: 'custom',
        startDate: date.toISOString().split('T')[0],
        endDate: customEndDate.toISOString().split('T')[0]
      })
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setCustomEndDate(date)
    if (date && customStartDate) {
      updateFilters({ 
        period: 'custom',
        startDate: customStartDate.toISOString().split('T')[0],
        endDate: date.toISOString().split('T')[0]
      })
    }
  }

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    doc.text("Customers", 14, 12)
    autoTable(doc, {
      head: [["Name", "Email", "Phone", "Vehicles", "Total Tickets", "Last Visit"]],
      body: customers.map((c) => [
        c.customerName,
        c.customerEmail,
        c.customerPhone,
        c.vehicles.map(v => v.plateNumber).join(", "),
        c.totalTickets,
        formatDate(c.lastVisit)
      ]),
    })
    doc.save("customers.pdf")
  }

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      customers.map((c) => ({
        Name: c.customerName,
        Email: c.customerEmail,
        Phone: c.customerPhone,
        Vehicles: c.vehicles.map(v => v.plateNumber).join(", "),
        "Total Tickets": c.totalTickets,
        "Last Visit": formatDate(c.lastVisit),
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Customers")
    XLSX.writeFile(wb, "customers.xlsx")
  }

  const handleEmailClick = (email: string) => {
    window.open(`https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${email}&su=Hello&body=Message&tf=cm`, '_blank')
  }

  const handleWhatsAppClick = (phone: string) => {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">{customers.length} Customer{customers.length !== 1 ? "s" : ""}</h1>
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <Select
            open={categoryOpen}
            onOpenChange={setCategoryOpen}
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center p-2">
                  <Spinner size="sm" />
                </div>
              ) : (
                <>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          {/* Date Period Filter */}
          <Select value={datePeriod} onValueChange={handleDatePeriodChange} disabled={isLoading}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Pickers */}
          {datePeriod === 'custom' && (
            <div className="flex gap-2">
              <DatePicker
                selected={customStartDate}
                onSelect={handleStartDateChange}
                placeholder="Start Date"
                disabled={isLoading}
              />
              <DatePicker
                selected={customEndDate}
                onSelect={handleEndDateChange}
                placeholder="End Date"
                disabled={isLoading}
              />
            </div>
          )}

          <button onClick={handleExportPDF} className="border rounded px-2 py-1 text-xs hover:bg-muted transition-colors">Export PDF</button>
          <button onClick={handleExportExcel} className="border rounded px-2 py-1 text-xs hover:bg-muted transition-colors">Export Excel</button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-2 md:px-4 py-1.5 md:py-3">Name</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Contact</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Vehicles</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Total Tickets</th>
              <th className="px-2 md:px-4 py-1.5 md:py-3">Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id} className="border-b border-border last:border-0">
                <td className="px-2 md:px-4 py-1.5 md:py-3 font-medium">
                  {customer.customerName}
                </td>
                <td className="px-2 md:px-4 py-1.5 md:py-3">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <button
                      onClick={() => handleEmailClick(customer.customerEmail)}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {customer.customerEmail}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Phone className="h-3 w-3" />
                    <span className="text-foreground">{customer.customerPhone}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleWhatsAppClick(customer.customerPhone)}
                        className="p-1 rounded hover:bg-green-100 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3 text-green-600 hover:text-green-800" />
                      </button>
                      <button
                        onClick={() => handlePhoneCall(customer.customerPhone)}
                        className="p-1 rounded hover:bg-blue-100 transition-colors"
                        title="Call"
                      >
                        <Phone className="h-3 w-3 text-blue-600 hover:text-blue-800" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-2 md:px-4 py-1.5 md:py-3">
                  <div className="flex flex-wrap gap-1">
                    {customer.vehicles.map((vehicle, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-blue-100"
                        onClick={() => window.location.href = `/inventory/tickets?ticketId=${vehicle.ticketId}`}
                        title={`Ticket ID: ${vehicle.ticketId}`}
                      >
                        {vehicle.plateNumber}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-2 md:px-4 py-1.5 md:py-3">
                  <Badge variant="secondary">
                    {customer.totalTickets}
                  </Badge>
                </td>
                <td className="px-2 md:px-4 py-1.5 md:py-3 text-muted-foreground">
                  {formatDate(customer.lastVisit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}