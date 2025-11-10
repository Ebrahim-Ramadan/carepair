"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Trash2, FileSpreadsheet, File, ChevronLeft, ChevronRight, Edit, ChevronDown, ChevronUp } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import type { Employee, MonthlyRecord } from "@/lib/types"
import { useRouter } from "next/navigation"

interface HRDepartmentClientProps {
  initialEmployees: Employee[]
  page: number
  totalPages: number
  total: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function HRDepartmentClient({ 
  initialEmployees,
  page,
  totalPages,
  total
}: HRDepartmentClientProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [isEditingEmployee, setIsEditingEmployee] = useState(false)
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [isEditingRecord, setIsEditingRecord] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null)
  const [deletingRecords, setDeletingRecords] = useState<string[]>([])
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    jobTitle: "",
    salary: ""
  })
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newRecord, setNewRecord] = useState({
    employeeId: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    workingDays: "26",
    absenceDays: "0"
  })
  const [editingRecord, setEditingRecord] = useState<{
    employeeId: string
    originalYear: number
    originalMonth: number
    year: number
    month: number
    workingDays: string
    absenceDays: string
  } | null>(null)
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null)

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newEmployee,
          salary: Number(newEmployee.salary),
          monthlyRecords: [],
          createdAt: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error('Failed to add employee')

      const addedEmployee = await response.json()
      setEmployees([...employees, addedEmployee])
      setIsAddingEmployee(false)
      setNewEmployee({ name: "", jobTitle: "", salary: "" })
      toast.success('Employee added successfully')
    } catch (error) {
      console.error('Error adding employee:', error)
      toast.error('Failed to add employee')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsEditingEmployee(true)
  }

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/employees/${editingEmployee._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingEmployee.name,
          jobTitle: editingEmployee.jobTitle,
          salary: Number(editingEmployee.salary)
        })
      })

      if (!response.ok) throw new Error('Failed to update employee')

      const updatedEmployee = await response.json()
      setEmployees(employees.map(emp => 
        emp._id === editingEmployee._id ? updatedEmployee : emp
      ))
      setIsEditingEmployee(false)
      setEditingEmployee(null)
      toast.success('Employee updated successfully')
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error('Failed to update employee')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddMonthlyRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/employees/${newRecord.employeeId}/monthly-record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: Number(newRecord.year),
          month: Number(newRecord.month),
          workingDays: Number(newRecord.workingDays),
          absenceDays: Number(newRecord.absenceDays)
        })
      })

      if (!response.ok) throw new Error('Failed to add monthly record')

      const updatedEmployee = await response.json()
      setEmployees(employees.map(emp => 
        emp._id === newRecord.employeeId ? updatedEmployee : emp
      ))
      setIsAddingRecord(false)
      setNewRecord({
        employeeId: "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        workingDays: "26",
        absenceDays: "0"
      })
      toast.success('Monthly record added successfully')
    } catch (error) {
      console.error('Error adding monthly record:', error)
      toast.error('Failed to add monthly record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMonthlyRecord = (employeeId: string, record: MonthlyRecord) => {
    setEditingRecord({
      employeeId,
      originalYear: record.year,
      originalMonth: record.month,
      year: record.year,
      month: record.month,
      workingDays: String(record.workingDays),
      absenceDays: String(record.absenceDays)
    })
    setIsEditingRecord(true)
  }

  const handleUpdateMonthlyRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/employees/${editingRecord.employeeId}/monthly-record`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: Number(editingRecord.year),
          month: Number(editingRecord.month),
          workingDays: Number(editingRecord.workingDays),
          absenceDays: Number(editingRecord.absenceDays)
        })
      })

      if (!response.ok) throw new Error('Failed to update monthly record')

      const updatedEmployee = await response.json()
      setEmployees(employees.map(emp => 
        emp._id === editingRecord.employeeId ? updatedEmployee : emp
      ))
      setIsEditingRecord(false)
      setEditingRecord(null)
      toast.success('Monthly record updated successfully')
    } catch (error) {
      console.error('Error updating monthly record:', error)
      toast.error('Failed to update monthly record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMonthlyRecord = async (employeeId: string, year: number, month: number) => {
    const recordKey = `${employeeId}-${year}-${month}`
    setDeletingRecords(prev => [...prev, recordKey])

    try {
      const response = await fetch(`/api/employees/${employeeId}/monthly-record?year=${year}&month=${month}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete monthly record')

      const updatedEmployee = await response.json()
      setEmployees(employees.map(emp => 
        emp._id === employeeId ? updatedEmployee : emp
      ))
      toast.success('Monthly record deleted successfully')
    } catch (error) {
      console.error('Error deleting monthly record:', error)
      toast.error('Failed to delete monthly record')
    } finally {
      setDeletingRecords(prev => prev.filter(key => key !== recordKey))
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    setDeletingIds(prev => [...prev, id])
    
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete employee')

      setEmployees(employees.filter(emp => emp._id !== id))
      toast.success('Employee deleted successfully')
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Failed to delete employee')
    } finally {
      setDeletingIds(prev => prev.filter(dId => dId !== id))
    }
  }

  const handleExportExcel = async () => {
    setIsExporting('excel')
    try {
      const response = await fetch('/api/employees/all')
      if (!response.ok) throw new Error('Failed to fetch employees')
      const allEmployees = await response.json()

      const XLSX = await import('xlsx')

      const workbook = XLSX.utils.book_new()
      
      // Summary sheet
      const summaryData = allEmployees.map(emp => ({
        Name: emp.name,
        'Job Title': emp.jobTitle,
        'Base Salary (KWD)': Number(emp.salary).toFixed(3),
        'Total Records': emp.monthlyRecords?.length || 0
      }))
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

      // Monthly records sheet
      const monthlyData: any[] = []
      allEmployees.forEach(emp => {
        emp.monthlyRecords?.forEach((record: any) => {
          monthlyData.push({
            'Employee Name': emp.name,
            'Job Title': emp.jobTitle,
            'Base Salary': Number(emp.salary).toFixed(3),
            'Month': MONTH_NAMES[record.month - 1],
            'Year': record.year,
            'Working Days': record.workingDays,
            'Absence Days': record.absenceDays,
            'Final Salary (KWD)': record.finalSalary.toFixed(3)
          })
        })
      })
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData)
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Records')

      XLSX.writeFile(workbook, 'employees-monthly-records.xlsx')
      toast.success('Successfully exported to Excel')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export to Excel')
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting('pdf')
    try {
      const response = await fetch('/api/employees/all')
      if (!response.ok) throw new Error('Failed to fetch employees')
      const allEmployees = await response.json()

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ])

      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Employee Monthly Salary Report', 14, 15)
      doc.setFontSize(10)
      doc.text(`Total Employees: ${allEmployees.length}`, 14, 25)

      let currentY = 30

      allEmployees.forEach((emp, idx) => {
        if (currentY > 250) {
          doc.addPage()
          currentY = 20
        }

        doc.setFontSize(11)
        doc.text(`${emp.name} - ${emp.jobTitle} (Base: ${Number(emp.salary).toFixed(3)} KWD)`, 14, currentY)
        currentY += 8

        if (emp.monthlyRecords && emp.monthlyRecords.length > 0) {
          autoTable(doc, {
            head: [['Month', 'Year', 'Working Days', 'Absence Days', 'Final Salary']],
            body: emp.monthlyRecords.map((record: any) => [
              MONTH_NAMES[record.month - 1],
              record.year,
              record.workingDays,
              record.absenceDays,
              record.finalSalary.toFixed(3)
            ]),
            startY: currentY,
            margin: { left: 14, right: 14 }
          })
          currentY = (doc as any).lastAutoTable.finalY + 10
        } else {
          doc.setFontSize(9)
          doc.text('No monthly records', 14, currentY)
          currentY += 6
        }
      })

      doc.save('employees-monthly-salary-report.pdf')
      toast.success('Successfully exported to PDF')
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      toast.error('Failed to export to PDF')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="min-h-screen px-2 mx-auto py-8">
      <div className="flex items-start md:items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground mt-1">
            {total} Employee {total !== 1 ? 's' : ''}
          </p>
        <div className="flex items-center gap-2 flex-col md:flex-row">
          <Button 
            size='sm' 
            variant="outline" 
            onClick={handleExportExcel}
            disabled={isExporting !== null}
          >
            {isExporting === 'excel' ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </>
            )}
          </Button>
          <Button 
            size='sm' 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExporting !== null}
          >
            {isExporting === 'pdf' ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <File className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
          <Button className="bg-[#002540]" size='sm' onClick={() => setIsAddingEmployee(true)}>
            <Plus className="w-4 h-4" />
            Add 
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 w-8"></th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Job Title</th>
              <th className="text-left p-4">Base Salary</th>
              <th className="text-left p-4">Monthly Records</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <>
                <tr key={employee._id}>
                  <td className="p-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setExpandedEmployeeId(expandedEmployeeId === employee._id ? null : employee._id)}
                    >
                      {expandedEmployeeId === employee._id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                  <td className="p-4">{employee.name}</td>
                  <td className="p-4">{employee.jobTitle}</td>
                  <td className="p-4">{Number(employee.salary).toFixed(3)} KWD</td>
                  <td className="p-4">{employee.monthlyRecords?.length || 0} records</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteEmployee(employee._id!)}
                        disabled={deletingIds.includes(employee._id!)}
                      >
                        {deletingIds.includes(employee._id!) ? (
                          <Spinner size="sm" className="text-red-500" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>

                {/* Expanded monthly records */}
                {expandedEmployeeId === employee._id && (
                  <tr>
                    <td colSpan={6} className="p-0 bg-muted/20">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Monthly Records</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNewRecord({ ...newRecord, employeeId: employee._id! })
                              setIsAddingRecord(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Record
                          </Button>
                        </div>

                        {employee.monthlyRecords && employee.monthlyRecords.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-t">
                              <thead className="bg-background">
                                <tr>
                                  <th className="text-left p-2">Month</th>
                                  <th className="text-left p-2">Year</th>
                                  <th className="text-left p-2">Working Days</th>
                                  <th className="text-left p-2">Absence Days</th>
                                  <th className="text-left p-2">Final Salary</th>
                                  <th className="text-left p-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {employee.monthlyRecords.map((record, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="p-2">{MONTH_NAMES[record.month - 1]}</td>
                                    <td className="p-2">{record.year}</td>
                                    <td className="p-2">{record.workingDays}</td>
                                    <td className="p-2">{record.absenceDays}</td>
                                    <td className="p-2 font-semibold text-green-600">{record.finalSalary.toFixed(3)} KWD</td>
                                    <td className="p-2">
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                          onClick={() => handleEditMonthlyRecord(employee._id!, record)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                          onClick={() => handleDeleteMonthlyRecord(employee._id!, record.year, record.month)}
                                          disabled={deletingRecords.includes(`${employee._id}-${record.year}-${record.month}`)}
                                        >
                                          {deletingRecords.includes(`${employee._id}-${record.year}-${record.month}`) ? (
                                            <Spinner size="sm" className="text-red-500" />
                                          ) : (
                                            <Trash2 className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No monthly records yet</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/HRDepartment?page=${page - 1}`)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/HRDepartment?page=${page + 1}`)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Add Employee Dialog */}
      <Dialog.Root 
        open={isAddingEmployee} 
        onOpenChange={(open) => {
          // Prevent closing while submitting
          if (isSubmitting && !open) return
          setIsAddingEmployee(open)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold">
                Add New Employee
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm mb-2">Name</label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm mb-2">Job Title</label>
                <Input
                  id="jobTitle"
                  value={newEmployee.jobTitle}
                  onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="salary" className="block text-sm mb-2">Base Salary (KWD)</label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="0.001"
                  value={newEmployee.salary}
                  onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingEmployee(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#002540]" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Employee'
                  )}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Employee Dialog */}
      <Dialog.Root 
        open={isEditingEmployee} 
        onOpenChange={(open) => {
          // Prevent closing while submitting
          if (isSubmitting && !open) return
          setIsEditingEmployee(open)
          if (!open) setEditingEmployee(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold">
                Edit Employee
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {editingEmployee && (
              <form onSubmit={handleUpdateEmployee} className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm mb-2">Name</label>
                  <Input
                    id="edit-name"
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-jobTitle" className="block text-sm mb-2">Job Title</label>
                  <Input
                    id="edit-jobTitle"
                    value={editingEmployee.jobTitle}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, jobTitle: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-salary" className="block text-sm mb-2">Base Salary (KWD)</label>
                  <Input
                    id="edit-salary"
                    type="number"
                    min="0"
                    step="0.001"
                    value={editingEmployee.salary}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditingEmployee(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#002540]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Employee'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Monthly Record Dialog */}
      <Dialog.Root 
        open={isAddingRecord} 
        onOpenChange={(open) => {
          if (isSubmitting && !open) return
          setIsAddingRecord(open)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold">
                Add Monthly Record
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleAddMonthlyRecord} className="space-y-4">
              <div>
                <label htmlFor="record-year" className="block text-sm mb-2">Year</label>
                <Input
                  id="record-year"
                  type="number"
                  min="2020"
                  max={new Date().getFullYear() + 1}
                  value={newRecord.year}
                  onChange={(e) => setNewRecord({ ...newRecord, year: e.target.value as any })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="record-month" className="block text-sm mb-2">Month</label>
                <select
                  id="record-month"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newRecord.month}
                  onChange={(e) => setNewRecord({ ...newRecord, month: e.target.value as any })}
                  disabled={isSubmitting}
                >
                  {MONTH_NAMES.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="record-workingDays" className="block text-sm mb-2">Working Days</label>
                <Input
                  id="record-workingDays"
                  type="number"
                  min="0"
                  max="26"
                  value={newRecord.workingDays}
                  onChange={(e) => {
                    const workingDays = Number(e.target.value)
                    const absenceDays = Math.max(0, 26 - workingDays)
                    setNewRecord({ ...newRecord, workingDays: e.target.value, absenceDays: String(absenceDays) })
                  }}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="record-absenceDays" className="block text-sm mb-2">Absence Days (Auto-calculated)</label>
                <Input
                  id="record-absenceDays"
                  type="number"
                  min="0"
                  max="26"
                  value={newRecord.absenceDays}
                  disabled={true}
                  className="bg-muted/50 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingRecord(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#002540]" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Record'
                  )}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Monthly Record Dialog */}
      <Dialog.Root 
        open={isEditingRecord} 
        onOpenChange={(open) => {
          if (isSubmitting && !open) return
          setIsEditingRecord(open)
          if (!open) setEditingRecord(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold">
                Edit Monthly Record
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {editingRecord && (
              <form onSubmit={handleUpdateMonthlyRecord} className="space-y-4">
                <div>
                  <label htmlFor="edit-record-year" className="block text-sm mb-2">Year</label>
                  <Input
                    id="edit-record-year"
                    type="number"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                    value={editingRecord.year}
                    onChange={(e) => setEditingRecord({ ...editingRecord, year: Number(e.target.value) })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-record-month" className="block text-sm mb-2">Month</label>
                  <select
                    id="edit-record-month"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={editingRecord.month}
                    onChange={(e) => setEditingRecord({ ...editingRecord, month: Number(e.target.value) })}
                    disabled={isSubmitting}
                  >
                    {MONTH_NAMES.map((month, idx) => (
                      <option key={idx} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-record-workingDays" className="block text-sm mb-2">Working Days</label>
                  <Input
                    id="edit-record-workingDays"
                    type="number"
                    min="0"
                    max="26"
                    value={editingRecord.workingDays}
                    onChange={(e) => {
                      const workingDays = Number(e.target.value)
                      const absenceDays = Math.max(0, 26 - workingDays)
                      setEditingRecord({ ...editingRecord, workingDays: e.target.value, absenceDays: String(absenceDays) })
                    }}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-record-absenceDays" className="block text-sm mb-2">Absence Days (Auto-calculated)</label>
                  <Input
                    id="edit-record-absenceDays"
                    type="number"
                    min="0"
                    max="26"
                    value={editingRecord.absenceDays}
                    disabled={true}
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditingRecord(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#002540]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Record'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}