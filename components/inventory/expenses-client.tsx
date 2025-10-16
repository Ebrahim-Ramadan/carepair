"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExpenseDialog } from "./expense-dialog";
import { PencilIcon, Plus, Trash2 } from "lucide-react";

type Expense = {
  _id: string;
  name: string;
  quantity: number;
  cost: number;
  note?: string;
  createdAt?: string;
};

export function ExpensesClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/inventory/expenses");
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedExpense) {
        // Handle edit (you'll need to create the PUT endpoint)
        await fetch(`/api/inventory/expenses/${selectedExpense._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Handle create
        await fetch("/api/inventory/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      fetchExpenses();
      setSelectedExpense(null);
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      await fetch(`/api/inventory/expenses/${id}`, {
        method: "DELETE",
      });
      fetchExpenses();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

  // ...existing code...
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);

  const handleExportExcel = async () => {
    setIsExporting('excel');
    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(expenses.map(exp => ({
        Name: exp.name,
        Quantity: exp.quantity,
        Cost: exp.cost,
        Note: exp.note,
        Date: exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : ''
      })));
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
      XLSX.writeFile(workbook, 'expenses.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting('pdf');
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Expenses List', 14, 15);
      doc.setFontSize(10);
      doc.text(`Total Expenses: ${expenses.length}`, 14, 25);
      autoTable(doc, {
        head: [['Name', 'Quantity', 'Cost', 'Note', 'Date']],
        body: expenses.map(exp => [
          exp.name,
          exp.quantity,
          exp.cost,
          exp.note,
          exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : ''
        ]),
        startY: 30,
      });
      doc.save('expenses.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting !== null}
          >
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting !== null}
          >
            Export PDF
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus />
            New
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense._id}>
              <TableCell>{expense.name}</TableCell>
              <TableCell>{expense.quantity}</TableCell>
              <TableCell>KWD{expense.cost.toFixed(2)}</TableCell>
              <TableCell>{expense.note}</TableCell>
              <TableCell>{expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : ''}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(expense)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(expense._id)}
                  >
                    <Trash2 className="text-white" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ExpenseDialog
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onSubmit={handleSubmit}
      />
    </div>
  );
}