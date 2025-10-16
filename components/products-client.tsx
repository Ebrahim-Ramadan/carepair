"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"


type Product = {
  _id?: string
  nameEn?: string
  nameAr?: string
  category?: string
  // only explicit prices now
  pricePerPiece?: number
  pricePerMeter?: number
  stock?: number
  description?: string
}

type Props = {
  initialProducts: Product[]
  initialPage: number
  totalPages: number
  total: number
  limit: number
}

export function ProductsClient({
  initialProducts,
  initialPage,
  totalPages: initialTotalPages,
  total: initialTotal,
  limit,
}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Product>({
    nameEn: "",
    nameAr: "",
    category: "",
    pricePerPiece: undefined,
    pricePerMeter: undefined,
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
    setForm({
      nameEn: "",
      nameAr: "",
      category: "",
      pricePerPiece: undefined,
      pricePerMeter: undefined,
      stock: 0,
      description: "",
    })
    setIsFormOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      nameEn: p.nameEn ??  "",
      nameAr: p.nameAr ?? "",
      category: p.category ?? "",
      pricePerPiece: typeof p.pricePerPiece === "number" ? p.pricePerPiece : undefined,
      pricePerMeter: typeof p.pricePerMeter === "number" ? p.pricePerMeter : undefined,
      stock: p.stock ?? 0,
      description: p.description ?? "",
      _id: p._id,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const pp = Number(form.pricePerPiece ?? 0)
      const pm = Number(form.pricePerMeter ?? 0)
      if (!form.nameEn) {
        toast.error("English name is required")
        setLoading(false)
        return
      }
      if (!(pp > 0 || pm > 0)) {
        toast.error("Provide a price for at least one mode (per piece or per meter)")
        setLoading(false)
        return
      }

      const payload: any = {
        nameEn: String(form.nameEn),
        nameAr: form.nameAr ? String(form.nameAr) : undefined,
        category: form.category ? String(form.category) : undefined,
        pricePerPiece: pp > 0 ? pp : undefined,
        pricePerMeter: pm > 0 ? pm : undefined,
        stock: form.stock ? Number(form.stock) : 0,
        description: form.description ? String(form.description) : "",
      }

      if (editing) {
        const res = await fetch(`/api/products/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update product")
        const updated = await res.json()
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
        toast.success("Product updated")
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create product")
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
      await fetchPage(page)
      toast.success("Product deleted")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  const priceLabel = (p: Product) => {
    const piece = typeof p.pricePerPiece === "number" ? p.pricePerPiece : undefined
    const meter = typeof p.pricePerMeter === "number" ? p.pricePerMeter : undefined

    if (piece != null && meter != null) {
      return (
        <div className="text-right leading-tight">
          <div className="text-sm font-medium">{piece.toFixed(3)} KD</div>
          <div className="text-sm text-muted-foreground">{meter.toFixed(3)} KD / m</div>
        </div>
      )
    }

    if (piece != null) return <div className="text-right">{piece.toFixed(3)} KD</div>
    if (meter != null) return <div className="text-right">{meter.toFixed(3)} KD / m</div>

    return "—"
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
              <th className="p-3">Name (EN)</th>
              <th className="p-3">Name (AR)</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center"><Spinner /></td>
              </tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No products</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{p.nameEn ??"-"}</td>
                  <td className="p-3">{p.nameAr ?? "-"}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3 text-right">{priceLabel(p)}</td>
                  <td className="p-3 text-right">{p.stock ?? 0}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => openEdit(p)}>
                        <Pencil />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(p._id)}>
                        <Trash className="text-white" />
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleSubmit} className="w-full">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 py-2">
              <label className="flex flex-col">
                <span className="text-sm">English name *</span>
                <input className="border rounded p-2" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </label>

              <label className="flex flex-col">
                <span className="text-sm">Arabic name</span>
                <input className="border rounded p-2" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm">Category</span>
                  <select
                    className="border rounded p-2"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="protection">Protection</option>
                    <option value="tanting">Tanting</option>
                    <option value="painting">Painting</option>
                    <option value="detailing">Detailing</option>
                    <option value="repair">Repair</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="flex flex-col">
                  <span className="text-sm">Stock</span>
                  <input type="number" className="border rounded p-2" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm">Price per piece</span>
                  <input
                    type="number"
                    step="0.001"
                    className="border rounded p-2"
                    value={form.pricePerPiece ?? ""}
                    onChange={(e) => setForm({ ...form, pricePerPiece: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm">Price per meter</span>
                  <input
                    type="number"
                    step="0.001"
                    className="border rounded p-2"
                    value={form.pricePerMeter ?? ""}
                    onChange={(e) => setForm({ ...form, pricePerMeter: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
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