"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

type Product = {
  _id?: string
  name: string
  sku?: string
  price: number
  stock?: number
  description?: string
  createdAt?: string
}

type Props = {
  initialProducts: Product[]
  initialPage: number
  totalPages: number
  total: number
  limit: number
}

export function ProductsClient({ initialProducts, initialPage, totalPages: initialTotalPages, total: initialTotal, limit }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Product>({
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    description: "",
  })

  const fetchPage = async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?page=${p}&limit=${limit}`)
      if (!res.ok) throw new Error("Failed to fetch products")
      const data = await res.json()
      setProducts(data.items)
      setTotal(data.total)
      setTotalPages(Math.max(1, Math.ceil(data.total / limit)))
      setPage(p)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: "", sku: "", price: 0, stock: 0, description: "" })
    setIsFormOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      price: p.price ?? 0,
      stock: p.stock ?? 0,
      description: p.description ?? "",
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      if (!form.name || Number.isNaN(form.price)) {
        toast.error("Name and price are required")
        return
      }

      if (editing) {
        const res = await fetch(`/api/products/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Failed to update product")
        const updated = await res.json()
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
        toast.success("Product updated")
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Failed to create product")
        const created = await res.json()
        // refresh current page
        await fetchPage(page)
        toast.success("Product added")
      }
      setIsFormOpen(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id) return
    if (!confirm("Delete this product?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      // refresh current page (if last item on page removed and page > 1, refetch previous)
      await fetchPage(page)
      toast.success("Product deleted")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
        <Button onClick={openAdd} size="sm">
          <Plus size={16} />
          Add
        </Button>
      </div>

      <div className="rounded-md border overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-muted/50">
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center"><Spinner /></td>
              </tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No products</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.sku}</td>
                  <td className="p-3 text-right">{p.price.toFixed(3)}</td>
                  <td className="p-3 text-right">{p.stock ?? 0}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => openEdit(p)}>
                        
                        <Pencil/>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(p._id)}>
                        <Trash className="text-white"/>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => fetchPage(Math.max(1, page - 1))} disabled={page <= 1 || loading}>
          <ChevronLeft size={16} />
        </Button>
        <div className="text-sm">
          Page {page} / {totalPages} ({total})
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Shadcn Dialog for form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleSubmit} className="w-full">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 py-2">
              <label className="flex flex-col">
                <span className="text-sm">Name</span>
                <input className="border rounded p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>

              <label className="flex flex-col">
                <span className="text-sm">SKU</span>
                <input className="border rounded p-2" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm">Price</span>
                  <input type="number" step="0.001" className="border rounded p-2" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm">Stock</span>
                  <input type="number" className="border rounded p-2" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                </label>
              </div>

              <label className="flex flex-col">
                <span className="text-sm">Description</span>
                <textarea className="border rounded p-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Spinner size="sm" className="mr-2" />Saving...</> : (editing ? "Save" : "Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}