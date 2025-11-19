"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import type { Payment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

const PERIODS = [
  { value: "month", label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
  { value: "year", label: "Last 12 Months" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
]

export default function SalesPage() {
  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    let yPosition = 20

    doc.setFontSize(16)
    doc.text("Sales Report", margin, yPosition)
    doc.setFontSize(10)
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, margin, yPosition + 8)
    yPosition += 20

    // Process each ticket
    tickets.forEach((t: any, ticketIndex: number) => {
      const totalAmount = t.totalAmount || 0
      const totalPaid = Array.isArray(t.payments) ? t.payments.reduce((sum: number, p: Payment) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0
      const remaining = Math.max(0, totalAmount - totalPaid)

      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }

      // Ticket header
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text(`Ticket #${ticketIndex + 1}`, margin, yPosition)
      yPosition += 7

      // Reset font for content
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)

      // Ticket details
      const details = [
        { label: 'Ticket ID', value: t._id },
        { label: 'Invoice No', value: t.invoiceNo || '-' },
        { label: 'Plate Number', value: t.plateNumber },
        { label: 'Customer Name', value: t.customerName },
        { label: 'Contact', value: t.customerPhone || t.customerEmail || '-' },
        { label: 'Invoice Date', value: t.invoiceDate ? format(new Date(t.invoiceDate), 'yyyy-MM-dd HH:mm') : t.createdAt ? format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm') : '-' },
        { label: 'Total Amount', value: totalAmount.toFixed(3) + ' KD' },
        { label: 'Total Paid', value: totalPaid.toFixed(3) + ' KD' },
        { label: 'Remaining', value: remaining.toFixed(3) + ' KD' },
      ]

      details.forEach((detail) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 20
        }
        doc.setFont(undefined, 'bold')
        doc.text(`${detail.label}:`, margin, yPosition)
        doc.setFont(undefined, 'normal')
        doc.text(String(detail.value), margin + 50, yPosition)
        yPosition += 6
      })

      // Payments section
      if (Array.isArray(t.payments) && t.payments.length > 0) {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 20
        }
        yPosition += 2
        doc.setFont(undefined, 'bold')
        doc.text('Payments:', margin, yPosition)
        yPosition += 6

        t.payments.forEach((p: Payment, pIdx: number) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage()
            yPosition = 20
          }
          doc.setFont(undefined, 'normal')
          // Debug payment object
          console.log('Payment object:', p, 'Method:', p.paymentMethod)
          const paymentMethod = p.paymentMethod || 'Not Set'
          const paymentText = `Payment ${pIdx + 1}: ${p.amount.toFixed(3)} KD - ${format(new Date(p.date), 'yyyy-MM-dd HH:mm')} - ${paymentMethod}`
          doc.text(paymentText, margin + 10, yPosition)
          yPosition += 5
        })
      }

      // Notes section
      if (t.notes) {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 20
        }
        yPosition += 2
        doc.setFont(undefined, 'bold')
        doc.text('Notes:', margin, yPosition)
        yPosition += 6
        doc.setFont(undefined, 'normal')
        const notesLines = doc.splitTextToSize(t.notes, pageWidth - 2 * margin - 10)
        notesLines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(line, margin + 10, yPosition)
          yPosition += 5
        })
      }

      // Separator between tickets
      yPosition += 8
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
    })

    doc.save("sales-tickets.pdf")
  }

  // Export to Excel
  const handleExportExcel = () => {
    // Find the maximum number of payments to determine column count
    const maxPayments = tickets.reduce((max: number, t: any) => {
      const paymentCount = t.payments && Array.isArray(t.payments) ? t.payments.length : 0;
      return Math.max(max, paymentCount);
    }, 0);

    // Build the header row with proper column order
    const headers: string[] = [
      "Ticket ID",
      "Invoice No",
      "Plate Number",
      "Customer Name",
      "Contact",
      "Invoice Date",
      "Total Amount",
      "Total Paid",
      "Remaining",
    ];

    // Add payment headers
    for (let i = 1; i <= maxPayments; i++) {
      headers.push(`Payment${i} Amount`);
      headers.push(`Payment${i} Date`);
      headers.push(`Payment${i} Method`);
    }

    headers.push("Notes");

    const rows = tickets.map((t: any) => {
      const totalAmount = t.totalAmount || 0;
      const totalPaid = Array.isArray(t.payments) ? t.payments.reduce((sum: number, p: Payment) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0;
      const remaining = Math.max(0, totalAmount - totalPaid);

      const row: any[] = [
        t._id,
        t.invoiceNo || '-',
        t.plateNumber,
        t.customerName,
        t.customerPhone || t.customerEmail || '-',
        t.invoiceDate ? format(new Date(t.invoiceDate), 'yyyy-MM-dd HH:mm') : t.createdAt ? format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm') : '-',
        totalAmount.toFixed(3) + ' KD',
        totalPaid.toFixed(3) + ' KD',
        remaining.toFixed(3) + ' KD',
      ];

      // Add payment data
      if (t.payments && Array.isArray(t.payments)) {
        t.payments.forEach((p: Payment, pIdx: number) => {
          // Debug payment object
          console.log(`Payment ${pIdx + 1}:`, p, 'Method:', p.paymentMethod)
          row.push(p.amount.toFixed(3) + ' KD');
          row.push(format(new Date(p.date), 'yyyy-MM-dd HH:mm'));
          row.push(p.paymentMethod || 'Not Set');
        });
      }
      
      // Fill empty payment slots
      for (let i = (t.payments?.length || 0); i < maxPayments; i++) {
        row.push('-');
        row.push('-');
        row.push('-');
      }

      row.push(t.notes || '-');
      return row;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "SalesTickets")
    XLSX.writeFile(wb, "sales-tickets.xlsx")
  }
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState("month")
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [endDate, setEndDate] = useState<string | undefined>(undefined)
  const [customRange, setCustomRange] = useState(false)

  useEffect(() => {
    fetchTickets()
    // eslint-disable-next-line
  }, [period, startDate, endDate])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      let url = "/api/tickets?sales=true&period=" + period
      if (period === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error("Failed to fetch tickets")
      const data = await res.json()
      // API returns array directly in sales mode 
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error("Failed to load tickets")
    } finally {
      setIsLoading(false)
    }
  }
console.log('Tickets with payments:', tickets.map(t => ({
  id: t._id, 
  payments: t.payments?.map((p: any, idx: number) => ({ 
    idx, 
    amount: p.amount, 
    method: p.paymentMethod,
    hasMethod: 'paymentMethod' in p 
  }))
})));
console.log('First ticket payments detail:', tickets[0]?.payments);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Sales (Tickets)</h1>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>Export PDF</Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>Export Excel</Button>
          <select
            className="border rounded px-2 py-1"
            value={period}
            onChange={e => {
              setPeriod(e.target.value)
              setCustomRange(e.target.value === "custom")
            }}
          >
            {PERIODS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {customRange && (
            <>
              <Input
                type="date"
                value={startDate || ""}
                onChange={e => setStartDate(e.target.value)}
                className="w-[140px]"
                placeholder="Start date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate || ""}
                onChange={e => setEndDate(e.target.value)}
                className="w-[140px]"
                placeholder="End date"
              />
              <Button size="sm" onClick={fetchTickets} disabled={!startDate || !endDate || isLoading}>
                Apply
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-md border overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-muted/50">
              <th className="p-3">Ticket ID</th>
              <th className="p-3">Invoice No</th>
              <th className="p-3">Plate Number</th>
              <th className="p-3">Customer Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Invoice Date</th>
              <th className="p-3 text-right">Total Amount</th>
              <th className="p-3 text-right">Total Paid</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10} className="p-6 text-center"><Spinner /></td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">No tickets found</td></tr>
            ) : (
              tickets.map((t: any) => {
                return (
                  <tr key={t._id} className="border-b hover:bg-muted/50 [&>*]:p-3">
                    <td className="text-blue-600 ">
                      <a href={`/inventory/tickets?ticketId=${t._id}`} target="_blank" className="text-blue-600 hover:underline">
                        {t._id}
                      </a>
                    </td>
                    <td>{t.invoiceNo || '-'}</td>
                    <td>{t.plateNumber}</td>
                    <td>{t.customerName}</td>
                    <td>{t.customerPhone || t.customerEmail || '-'}</td>
                    <td>{t.invoiceDate ? format(new Date(t.invoiceDate), 'yyyy-MM-dd HH:mm') : t.createdAt ? format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm') : '-'}</td>
                    <td className=" text-right">{(t.totalAmount || 0).toFixed(3)} KD</td>
                    <td className=" text-right">{(Array.isArray(t.payments) ? t.payments.reduce((sum: number, p: Payment) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0).toFixed(3)} KD</td>
                    
                    <td className=" text-right">{(Math.max(0, (t.totalAmount || 0) - (Array.isArray(t.payments) ? t.payments.reduce((sum: number, p: Payment) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0))).toFixed(3)} KD</td>
                    <td>{t.notes || '-'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
