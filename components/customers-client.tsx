"use client"

import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageCircle } from "lucide-react"

type Customer = {
  _id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  totalTickets: number
  lastVisit: string
  vehicles: Array<{
    plateNumber: string
    mileage: number
  }>
}

function formatDate(value: string | Date) {
  const d = new Date(value)
  return d.toLocaleString()
}

type CustomersClientProps = {
  initialCustomers: Customer[]
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers] = useState<Customer[]>(initialCustomers)

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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold"> {customers.length} Customer{customers.length !== 1 ? "s" : ""}</h1>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="border rounded px-2 py-1 text-xs hover:bg-muted transition-colors">Export PDF</button>
          <button onClick={handleExportExcel} className="border rounded px-2 py-1 text-xs hover:bg-muted transition-colors">Export Excel</button>
        </div>
      </div>
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
                      <Badge key={index} variant="outline" className="text-xs">
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
    </div>
  )
}