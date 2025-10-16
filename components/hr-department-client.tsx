"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Trash2, FileSpreadsheet, File, ChevronLeft, ChevronRight, Edit } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import type { Employee } from "@/lib/types"
import { useRouter } from "next/navigation"

interface HRDepartmentClientProps {
  initialEmployees: Employee[]
  page: number
  totalPages: number
  total: number
}

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    jobTitle: "",
    salary: ""
  })
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
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

      // Dynamically import XLSX
      const XLSX = await import('xlsx')

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(allEmployees.map(emp => ({
        Name: emp.name,
        'Job Title': emp.jobTitle,
        'Salary (KWD)': emp.salary,
        'Created At': new Date(emp.createdAt).toLocaleDateString()
      })))

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees')
      XLSX.writeFile(workbook, 'employees.xlsx')
      
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

      // Dynamically import jsPDF and autoTable
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ])

      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Employee List', 14, 15)
      doc.setFontSize(10)
      doc.text(`Total Employees: ${allEmployees.length}`, 14, 25)

      autoTable(doc, {
        head: [['Name', 'Job Title', 'Salary (KWD)', 'Created At']],
        body: allEmployees.map(emp => [
          emp.name,
          emp.jobTitle,
          emp.salary,
          new Date(emp.createdAt).toLocaleDateString()
        ]),
        startY: 30,
      })

      doc.save('employees.pdf')
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

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Job Title</th>
              <th className="text-left p-4">Salary</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee._id} className="border-t">
                <td className="p-4">{employee.name}</td>
                <td className="p-4">{employee.jobTitle}</td>
                <td className="p-4">{employee.salary} KWD</td>
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
                <label htmlFor="salary" className="block text-sm mb-2">Salary (KWD)</label>
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
                  <label htmlFor="edit-salary" className="block text-sm mb-2">Salary (KWD)</label>
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
    </div>
  )
}