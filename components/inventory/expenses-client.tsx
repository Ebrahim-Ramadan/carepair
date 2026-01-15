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

// date-fns helpers
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  startOfDay,
  endOfDay,
} from "date-fns";

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
  const [datePreset, setDatePreset] = useState("custom"); // "last7days" | "lastMonth" | "lastYear" | "custom"

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);

  // Fetch expenses on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/inventory/expenses");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setExpenses(data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  // Lazy load categories
  const loadCategories = async () => {
    if (categoriesLoaded || categoriesLoading) return;
    setCategoriesLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      setCategoriesLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (filterDropdownOpen) loadCategories();
  }, [filterDropdownOpen]);

  useEffect(() => {
    if (isDialogOpen) loadCategories();
  }, [isDialogOpen]);

  // Apply preset → set dates automatically
  useEffect(() => {
    const today = new Date();

    if (datePreset === "last7days") {
      const start = startOfDay(subDays(today, 6)); // 7 days including today
      const end = endOfDay(today);
      setFilterStartDate(start.toISOString().split("T")[0]);
      setFilterEndDate(end.toISOString().split("T")[0]);
    } else if (datePreset === "lastMonth") {
      const start = startOfMonth(subMonths(today, 1));
      const end = endOfMonth(subMonths(today, 1));
      setFilterStartDate(start.toISOString().split("T")[0]);
      setFilterEndDate(end.toISOString().split("T")[0]);
    } else if (datePreset === "lastYear") {
      const start = startOfYear(subYears(today, 1));
      const end = endOfYear(subYears(today, 1));
      setFilterStartDate(start.toISOString().split("T")[0]);
      setFilterEndDate(end.toISOString().split("T")[0]);
    }
    // "custom" → do nothing, let user pick via inputs
  }, [datePreset]);

  // Reset preset to "custom" when user manually changes date inputs
  const handleManualDateChange = () => {
    setDatePreset("custom");
  };

  // CRUD, filtering, export logic remains almost the same...
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
      if (!res.ok) throw new Error();

      const refreshed = await fetch("/api/inventory/expenses").then((r) => r.json());
      setExpenses(refreshed ?? []);
      setSelectedExpense(null);
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/inventory/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

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

  const handleExportExcel = async () => { /* unchanged */ };
  const handleExportPDF = async () => { /* unchanged */ };

  const showCustomDates = datePreset === "custom";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting !== null}>
            {isExporting === "excel" ? "Exporting..." : "Export Excel"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting !== null}>
            {isExporting === "pdf" ? "Exporting..." : "Export PDF"}
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size='sm'>
            <Plus className="h-4 w-4" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] p-4 bg-muted/40 rounded-lg border">
        {/* Category */}
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

        {/* Preset selector */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Date Range</label>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="last7days">Last 7 days</option>
            <option value="lastMonth">Last month</option>
            <option value="lastYear">Last year</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* From – only when custom */}
        {showCustomDates && (
          <div>
            <label className="block text-sm font-medium mb-1.5">From</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                handleManualDateChange();
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        )}

        {/* To – only when custom */}
        {showCustomDates && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5">To</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  handleManualDateChange();
                }}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory("");
                setFilterStartDate("");
                setFilterEndDate("");
                setDatePreset("custom");
              }}
            >
              Clear
            </Button>
          </div>
        )}

        {/* When NOT custom → show Clear in its own cell */}
        {!showCustomDates && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory("");
                setFilterStartDate("");
                setFilterEndDate("");
                setDatePreset("custom");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Table section remains the same */}
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
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)}>
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