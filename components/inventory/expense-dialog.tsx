"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Category = {
  _id: string;
  name: string;
};

export function ExpenseDialog({ 
  isOpen, 
  onOpenChange, 
  expense = null,
  onSubmit,
  categories = [],
  categoriesLoading = false
}: { 
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: { name: string; quantity: number; cost: number; note?: string; category?: string } | null;
  onSubmit: (data: any) => void;
  categories?: Category[];
  categoriesLoading?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    cost: "",
    note: "",
    category: ""
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        name: expense.name,
        quantity: expense.quantity.toString(),
        cost: expense.cost.toString(),
        note: expense.note || "",
        category: expense.category || ""
      });
    } else {
      setFormData({
        name: "",
        quantity: "",
        cost: "",
        note: "",
        category: ""
      });
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
    setFormData({ name: "", quantity: "", cost: "", note: "", category: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            Fill in the expense details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              required
              disabled={categoriesLoading}
            >
              <option value="">{categoriesLoading ? 'Loading...' : 'Select category'}</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) =>
                setFormData({ ...formData, cost: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            {expense ? "Update" : "Add"} Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}