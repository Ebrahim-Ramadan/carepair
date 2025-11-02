"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
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
    doc.text("Sales (Tickets)", 14, 12)
    autoTable(doc, {
      head: [[
        "Ticket ID", "Invoice No", "Plate Number", "Customer Name", "Contact", "Payment Date", "Payment Method", "Total Amount", "Remaining", "Total Paid", "Notes"
      ]],
      body: tickets.map((t: any) => {
        const totalAmount = t.totalAmount || 0;
        const totalPaid = Array.isArray(t.payments) ? t.payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0;
        const remaining = Math.max(0, totalAmount - totalPaid);
        return [
          t._id.slice(0, 8),
          t.invoiceNo || '-',
          t.plateNumber,
          t.customerName,
          t.customerPhone || t.customerEmail || '-',
          t.paymentTime ? format(new Date(t.paymentTime), 'yyyy-MM-dd HH:mm') : '-',
          t.paymentMethod || '-',
          totalAmount.toFixed(3) + ' KD',
          remaining.toFixed(3) + ' KD',
          totalPaid.toFixed(3) + ' KD',
          t.notes || '-',
        ]
      })
    })
    doc.save("sales-tickets.pdf")
  }

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      tickets.map((t: any) => {
        const totalAmount = t.totalAmount || 0;
        const totalPaid = Array.isArray(t.payments) ? t.payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0;
        const remaining = Math.max(0, totalAmount - totalPaid);
        return {
          "Ticket ID": t._id,
          "Invoice No": t.invoiceNo || '-',
          "Plate Number": t.plateNumber,
          "Customer Name": t.customerName,
          "Contact": t.customerPhone || t.customerEmail || '-',
          "Payment Date": t.paymentTime ? format(new Date(t.paymentTime), 'yyyy-MM-dd HH:mm') : '-',
          "Payment Method": t.paymentMethod || '-',
          "Total Amount": totalAmount.toFixed(3) + ' KD',
          "Remaining": remaining.toFixed(3) + ' KD',
          "Total Paid": totalPaid.toFixed(3) + ' KD',
          "Notes": t.notes || '-',
        }
      })
    )
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
      let url = "/api/tickets?period=" + period
      if (period === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch tickets")
      const data = await res.json()
      setTickets(data)
    } catch (err) {
      toast.error("Failed to load tickets")
    } finally {
      setIsLoading(false)
    }
  }

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
              <th className="p-3">Payment Method</th>
              <th className="p-3 text-right">Total Amount</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3 text-right">Total Paid</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="p-6 text-center"><Spinner /></td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No tickets found</td></tr>
            ) : (
              tickets.map((t: any) => {
                // Payment fee logic (same as in ticket-view)
                function getPaymentFee(method: string, amount: number): number {
                  if (!method) return 0;
                  const m = method.toLowerCase();
                  if (m === 'myfatoorah' || m === 'maifatoora' || m === 'ماي فاتورة') return 0.275;
                  if (m === 'knet' || m === 'knent') return 0;
                  if (m === 'cash') return 0;
                  if (m === 'tabby' || m === 'tabbykib') return amount * 0.0799;
                  if (m === 'kib') return amount * 0.10;
                  return 0;
                }
                const totalBefore = t.totalAmount || 0;
                const paymentFee = getPaymentFee(t.paymentMethod, totalBefore);
                const totalAfter = totalBefore - paymentFee;
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
                    <td>{t.paymentTime ? format(new Date(t.paymentTime), 'yyyy-MM-dd HH:mm') : '-'}</td>
                    <td>{t.paymentMethod || '-'}</td>
                    <td className=" text-right">{(t.totalAmount || 0).toFixed(3)} KD</td>
                    <td className=" text-right">{(Math.max(0, (t.totalAmount || 0) - (Array.isArray(t.payments) ? t.payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0))).toFixed(3)} KD</td>
                    <td className=" text-right">{(Array.isArray(t.payments) ? t.payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0) : 0).toFixed(3)} KD</td>
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
