"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Trash2 } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import type { Employee } from "@/lib/types"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    jobTitle: "",
    salary: ""
  })
  const [deletingIds, setDeletingIds] = useState<string[]>([])

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">HR Department</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total Employees: {total}
          </p>
        </div>
        <Button onClick={() => setIsAddingEmployee(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
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
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/HRDepartment?page=${page + 1}`)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

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
                <Button type="submit" disabled={isSubmitting}>
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
    </div>
  )
}