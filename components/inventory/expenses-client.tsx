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
import LoadingDots from "../ui/loading-spinner";

type Expense = {
  _id: string;
  name: string;
  quantity: number;
  cost: number;
  category: string;
  note?: string;
  createdAt?: string;
};

type Category = {
  _id: string;
  name: string;
};

export function ExpensesClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);

  // ──────────────────────────────────────────────
  // Fetch all expenses (still on mount)
  // ──────────────────────────────────────────────
  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/inventory/expenses");
        if (!res.ok) throw new Error("Failed to fetch expenses");
        const data = await res.json();
        setExpenses(data ?? []);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // ──────────────────────────────────────────────
  // Lazy-load categories when needed
  // ──────────────────────────────────────────────
  const loadCategories = async () => {
    if (categoriesLoaded || categoriesLoading) return;

    setCategoriesLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      setCategoriesLoaded(true);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Trigger when filter dropdown is opened
  useEffect(() => {
    if (filterDropdownOpen) {
      loadCategories();
    }
  }, [filterDropdownOpen]);

  // Trigger when dialog is opened
  useEffect(() => {
    if (isDialogOpen) {
      loadCategories();
    }
  }, [isDialogOpen]);

  // ──────────────────────────────────────────────
  // CRUD Handlers
  // ──────────────────────────────────────────────
  const handleSubmit = async (formData: any) => {
    if (!formData.category) {
      alert("Please select a category.");
      return;
    }

    try {
      const url = selectedExpense
        ? `/api/inventory/expenses/${selectedExpense._id}`
        : "/api/inventory/expenses";

      const method = selectedExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      // Refresh list
      const refreshed = await fetch("/api/inventory/expenses").then((r) => r.json());
      setExpenses(refreshed ?? []);

      setSelectedExpense(null);
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to save expense:", err);
      alert("Failed to save expense. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`/api/inventory/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Failed to delete expense.");
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

  // ──────────────────────────────────────────────
  // Filtering logic
  // ──────────────────────────────────────────────
  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory = !filterCategory || exp.category === filterCategory;

    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const expDate = exp.createdAt ? new Date(exp.createdAt) : null;
      if (expDate) {
        if (filterStartDate) {
          const start = new Date(filterStartDate);
          matchesDate &&= expDate >= start;
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          matchesDate &&= expDate <= end;
        }
      }
    }

    return matchesCategory && matchesDate;
  });

  // ──────────────────────────────────────────────
  // Export handlers (unchanged logic, minor cleanup)
  // ──────────────────────────────────────────────
  const handleExportExcel = async () => {
    setIsExporting("excel");
    try {
      const XLSX = (await import("xlsx")).default;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(
        expenses.map((e) => ({
          Name: e.name,
          Quantity: e.quantity,
          Cost: e.cost,
          Category: e.category,
          Note: e.note ?? "",
          Date: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");
      XLSX.writeFile(wb, "expenses.xlsx");
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Failed to export Excel.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting("pdf");
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Expenses", 14, 15);
      doc.setFontSize(10);
      doc.text(`Total: ${expenses.length}`, 14, 25);

      autoTable(doc, {
        startY: 35,
        head: [["Name", "Qty", "Cost", "Category", "Note", "Date"]],
        body: expenses.map((e) => [
          e.name,
          e.quantity,
          `KWD ${e.cost.toFixed(2)}`,
          e.category,
          e.note ?? "",
          e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "",
        ]),
      });

      doc.save("expenses.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(null);
    }
  };

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-2">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting !== null}
          >
            {isExporting === "excel" ? "Exporting..." : "Export Excel"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting !== null}
          >
            {isExporting === "pdf" ? "Exporting..." : "Export PDF"}
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 bg-muted/40 rounded-lg border">
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            onClick={() => setFilterDropdownOpen(true)}
            onBlur={() => setTimeout(() => setFilterDropdownOpen(false), 150)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">From</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">To</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div className="flex items-end flex items-end w-full justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterCategory("");
              setFilterStartDate("");
              setFilterEndDate("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingDots />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </p>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((exp) => (
                    <TableRow key={exp._id}>
                      <TableCell className="font-medium">{exp.name}</TableCell>
                      <TableCell>{exp.quantity}</TableCell>
                      <TableCell>KWD {exp.cost.toFixed(2)}</TableCell>
                      <TableCell>{exp.category}</TableCell>
                      <TableCell className="max-w-xs truncate">{exp.note || "—"}</TableCell>
                      <TableCell>
                        {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(exp)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDelete(exp._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Dialog */}
      <ExpenseDialog
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onSubmit={handleSubmit}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />
    </div>
  );
}