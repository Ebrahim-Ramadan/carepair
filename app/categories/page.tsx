'use client';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingDots from "@/components/ui/loading-spinner";
import { Pen, Trash2 } from "lucide-react";

type Category = {
  _id: string;
  name: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    console.log('data', data);
    
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleAdd() {
    if (!newCategory.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory })
    });
    setNewCategory("");
    fetchCategories();
  }

  async function handleDelete(id: string) {
    await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    fetchCategories();
  }

  function handleEdit(id: string, name: string) {
    setEditingId(id);
    setEditingName(name);
  }

  async function handleSaveEdit(id: string) {
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editingName })
    });
    setEditingId(null);
    setEditingName("");
    fetchCategories();
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      <div className="flex gap-2 mb-6">
        <input
        autoFocus
          className="border px-2 py-1 rounded w-full"
          placeholder="New category name"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={!newCategory.trim()}>Add</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><LoadingDots /></div>
      ) : categories.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">No categories found.</div>
      ) : (
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat._id} className="flex items-center gap-2">
              {editingId === cat._id ? (
                <>
                  <input
                    className="border px-2 py-1 rounded"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                  />
                  <Button size="sm" onClick={() => handleSaveEdit(cat._id)}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{cat.name}</span>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(cat._id, cat.name)}>
                    <Pen/>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(cat._id)}>
                    <Trash2 className="text-red-500"/>
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
