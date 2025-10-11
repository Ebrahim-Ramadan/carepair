"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import type { Service } from "@/lib/types"

type ServiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Partial<Service>
  onSubmit: (service: Partial<Service>) => Promise<void>
  isLoading?: boolean
}

export function ServiceDialog({ 
  open, 
  onOpenChange, 
  service, 
  onSubmit,
  isLoading 
}: ServiceDialogProps) {
  const [form, setForm] = useState<Partial<Service>>({
    nameEn: service?.nameEn ?? "",
    nameAr: service?.nameAr ?? "",
    // descriptionEn: service?.descriptionEn ?? "",
    // descriptionAr: service?.descriptionAr ?? "",
    price: service?.price ?? 0,
    category: service?.category ?? ""
  })

  // Reset form when service prop changes
  useEffect(() => {
    if (service) {
      setForm({
        nameEn: service.nameEn,
        nameAr: service.nameAr,
        // descriptionEn: service.descriptionEn,
        // descriptionAr: service.descriptionAr,
        price: service.price,
        category: service.category
      })
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold">
              {service ? "Edit Service" : "Add New Service"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name (English)</label>
                <Input
                  required
                  value={form.nameEn}
                  onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name (Arabic)</label>
                <Input
                  required
                  value={form.nameAr}
                  onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  <option value="protection">Protection</option>
                  <option value="tinting">Tinting</option>
                  <option value="painting">Painting</option>
                  <option value="detailing">Detailing</option>
                  <option value="repair">Repair</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (KWD)</label>
                <Input
                  required
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

          

            {/* <div className="space-y-2">
              <label className="text-sm font-medium">Description (English)</label>
              <Textarea
                value={form.descriptionEn}
                onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Arabic)</label>
              <Textarea
                value={form.descriptionAr}
                onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                dir="rtl"
                rows={3}
              />
            </div> */}

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : service ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}