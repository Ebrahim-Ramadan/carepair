"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Save, Check } from "lucide-react"
import { toast } from "sonner"
import type { Photo } from "@/lib/types"

type PhotoUploadProps = {
  title: string
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  ticketId: string
}

type PreviewPhoto = {
  id: string
  file: File
  url: string
  name: string
  isUploaded?: boolean
  uploadedPhotoId?: string
}

export function PhotoUpload({ title, photos = [], onPhotosChange, ticketId }: PhotoUploadProps) {
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos ?? [])
  const [previewPhotos, setPreviewPhotos] = useState<PreviewPhoto[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalPhotos(photos ?? [])
    setHasUnsavedChanges(false)
  }, [photos])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPreviewPhotos: PreviewPhoto[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }))

    setPreviewPhotos([...previewPhotos, ...newPreviewPhotos])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadAll = async () => {
    const unuploadedPhotos = previewPhotos.filter(photo => !photo.isUploaded)
    if (unuploadedPhotos.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = unuploadedPhotos.map(async (previewPhoto) => {
        const formData = new FormData()
        formData.append("file", previewPhoto.file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Failed to upload file")

        const result = await response.json()
        return { previewPhoto, uploadResult: result }
      })

      const uploadResults = await Promise.all(uploadPromises)
      
      // Map Cloudinary response to Photo format for local photos
      const formattedPhotos = uploadResults.map(({ uploadResult }) => ({
        id: uploadResult.id,
        url: uploadResult.url,
        name: uploadResult.name,
        public_id: uploadResult.public_id
      }))
      
      // Update local photos with uploaded ones
      setLocalPhotos([...localPhotos, ...formattedPhotos])
      setHasUnsavedChanges(true)
      
      // Mark preview photos as uploaded instead of clearing them
      setPreviewPhotos(prevPhotos => 
        prevPhotos.map(photo => {
          const uploadResult = uploadResults.find(({ previewPhoto }) => previewPhoto.id === photo.id)
          if (uploadResult) {
            return {
              ...photo,
              isUploaded: true,
              uploadedPhotoId: uploadResult.uploadResult.id
            }
          }
          return photo
        })
      )

      // Show success message with Sonner toast
      const count = uploadResults.length
      const message = `Successfully uploaded ${count} photo${count !== 1 ? 's' : ''} to cloud storage!`
      toast.success(message)
      
    } catch (error) {
      console.error("Error uploading photos:", error)
      toast.error("Failed to upload photos. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = (id: string) => {
    setLocalPhotos(localPhotos.filter((photo) => photo.id !== id))
    setHasUnsavedChanges(true)
  }

  const handleRemovePreviewPhoto = (id: string) => {
    const photoToRemove = previewPhotos.find(photo => photo.id === id)
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.url)
      
      // If the photo was uploaded, also remove it from local photos
      if (photoToRemove.isUploaded && photoToRemove.uploadedPhotoId) {
        setLocalPhotos(localPhotos.filter(photo => photo.id !== photoToRemove.uploadedPhotoId))
        setHasUnsavedChanges(true)
      }
    }
    setPreviewPhotos(previewPhotos.filter((photo) => photo.id !== id))
  }

  const handleClearAllPreviews = () => {
    previewPhotos.forEach(photo => URL.revokeObjectURL(photo.url))
    setPreviewPhotos([])
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

      <div className="space-y-6">
        {/* Browse Photos Section */}
        <div className="space-y-3">
         
          
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            Browse Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Preview Photos */}
          {previewPhotos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {previewPhotos.length} photo{previewPhotos.length !== 1 ? 's' : ''} selected
                  {previewPhotos.filter(p => p.isUploaded).length > 0 && (
                    <span className="ml-2 text-green-600">
                      ({previewPhotos.filter(p => p.isUploaded).length} uploaded)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  {previewPhotos.filter(p => !p.isUploaded).length > 0 && (
                    <Button
                      onClick={handleUploadAll}
                      size="sm"
                      disabled={isUploading}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? "Uploading..." : `Upload ${previewPhotos.filter(p => !p.isUploaded).length}`}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllPreviews}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {previewPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`group relative aspect-video overflow-hidden rounded-lg border bg-secondary ${
                      photo.isUploaded 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-dashed border-border'
                    }`}
                  >
                    <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                    
                    {/* Upload status indicator */}
                    {photo.isUploaded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 text-white p-2 rounded-full">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        photo.isUploaded 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {photo.isUploaded ? 'Uploaded' : 'Preview'}
                      </span>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute text-white right-2 top-2 h-5 rounded-full w-5 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleRemovePreviewPhoto(photo.id)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Photos Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Uploaded Photos {localPhotos.length > 0 && `(${localPhotos.length})`}
          </h4>
          
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

          {localPhotos.length === 0 && previewPhotos.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-secondary">
              <p className="text-sm text-muted-foreground">No photos uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
