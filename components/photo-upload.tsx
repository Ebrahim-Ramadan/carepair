"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Save } from "lucide-react"
import type { Photo } from "@/lib/types"

type PhotoUploadProps = {
  title: string
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  ticketId: string
}

export function PhotoUpload({ title, photos = [], onPhotosChange, ticketId }: PhotoUploadProps) {
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos ?? [])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalPhotos(photos ?? [])
    setHasUnsavedChanges(false)
  }, [photos])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Failed to upload file")

        return await response.json()
      })

      const uploadedPhotos = await Promise.all(uploadPromises)
      setLocalPhotos([...localPhotos, ...uploadedPhotos])
      setHasUnsavedChanges(true)
    } catch (error) {
      console.error("Error uploading photos:", error)
      alert("Failed to upload photos. Please try again.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemovePhoto = (id: string) => {
    setLocalPhotos(localPhotos.filter((photo) => photo.id !== id))
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    onPhotosChange(localPhotos)
    setHasUnsavedChanges(false)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {hasUnsavedChanges && <span className="text-xs text-amber-500">● Unsaved</span>}
        </div>
        <Button variant="default" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 bg-transparent"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Photos"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {localPhotos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {localPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-secondary"
              >
                <img src={photo.url || "/placeholder.svg"} alt={photo.name} className="h-full w-full object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleRemovePhoto(photo.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {localPhotos.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-secondary">
            <p className="text-sm text-muted-foreground">No photos uploaded</p>
          </div>
        )}
      </div>
    </div>
  )
}
