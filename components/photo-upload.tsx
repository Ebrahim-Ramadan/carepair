"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Check, Loader2 } from "lucide-react"
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
  const [isUploading, setIsUploading] = useState(false)
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null)
  const [clearingPhotoUrl, setClearingPhotoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialRenderRef = useRef(true)

  // Only sync localPhotos with photos prop on mount and when photos prop changes
  // This prevents the infinite update loop
  useEffect(() => {
    // Skip the effect if this is an update caused by our own state changes
    if (JSON.stringify(localPhotos) === JSON.stringify(photos)) {
      return;
    }
    
    setLocalPhotos(photos ?? [])
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
        url: uploadResult.url,
        name: uploadResult.name
      }))
      
      // Save to MongoDB immediately after successful upload
      if (ticketId && formattedPhotos.length > 0) {
        const photoType = title.toLowerCase().includes('before') ? 'beforePhotos' : 'afterPhotos'
        const updatedPhotos = [...localPhotos, ...formattedPhotos]
        
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [photoType]: updatedPhotos,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save photos to database")
        }

        const updatedTicket = await response.json()
        
        // Update local state first
        setLocalPhotos(updatedPhotos)
        
        // Then notify parent component about the change
        onPhotosChange(updatedPhotos)
      }
      
      // Clear ALL preview photos after successful upload - clean up memory
      previewPhotos.forEach(photo => URL.revokeObjectURL(photo.url))
      setPreviewPhotos([])

      // Show success message with Sonner toast
      const count = uploadResults.length
      const message = `Successfully uploaded ${count} photo${count !== 1 ? 's' : ''} to cloud storage and database!`
      toast.success(message)
      
    } catch (error) {
      console.error("Error uploading photos:", error)
      toast.error("Failed to upload photos. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearClick = (photoUrl: string) => {
    if (clearingPhotoUrl === photoUrl) {
      // Second click - show confirmation dialog
      handleRemovePhoto(photoUrl)
    } else {
      // First click - show "Clear" state
      setClearingPhotoUrl(photoUrl)
      // Auto-revert after 3 seconds if not clicked again
      setTimeout(() => {
        setClearingPhotoUrl(prev => prev === photoUrl ? null : prev)
      }, 3000)
    }
  }

  const handleRemovePhoto = async (photoUrl: string) => {
    const photoToDelete = localPhotos.find(photo => photo.url === photoUrl)
    if (!photoToDelete) return

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${photoToDelete.name}"?\n\nThis will permanently remove the image from both cloud storage and the database. This action cannot be undone.`
    )
    
    if (!confirmed) {
      setClearingPhotoUrl(null)
      return
    }

    setDeletingPhotoUrl(photoUrl)
    setClearingPhotoUrl(null)

    try {
      const photoType = title.toLowerCase().includes('before') ? 'beforePhotos' : 'afterPhotos'
      
      // Delete from Cloudinary and MongoDB via API - only pass URL and let API extract publicId
      const response = await fetch(
        `/api/images/delete?ticketId=${ticketId}&type=${photoType}&photoUrl=${encodeURIComponent(photoUrl)}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete image')
      }

      const result = await response.json()

      // Update local state
      const updatedPhotos = localPhotos.filter((photo) => photo.url !== photoUrl)
      
      // Update local state first
      setLocalPhotos(updatedPhotos)
      
      // Then notify parent about the change
      onPhotosChange(updatedPhotos)

      toast.success(result.message || 'Image deleted successfully from cloud storage and database')
      
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error(`Failed to delete image: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setDeletingPhotoUrl(null)
    }
  }

  const handleRemovePreviewPhoto = (id: string) => {
    const photoToRemove = previewPhotos.find(photo => photo.id === id)
    if (!photoToRemove) return

    // Clean up preview (only handling non-uploaded previews now)
    URL.revokeObjectURL(photoToRemove.url)
    setPreviewPhotos(previewPhotos.filter((photo) => photo.id !== id))
  }

  const handleClearAllPreviews = () => {
    previewPhotos.forEach(photo => URL.revokeObjectURL(photo.url))
    setPreviewPhotos([])
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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
            <div className="space-y-3 border-b border-neutral-500 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs leading-none text-muted-foreground">
                  {previewPhotos.length} photo{previewPhotos.length !== 1 ? 's' : ''} selected
                  {previewPhotos.filter(p => p.isUploaded).length > 0 && (
                    <span className="ml-2 text-green-600">
                      ({previewPhotos.filter(p => p.isUploaded).length} uploaded)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllPreviews}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                  {previewPhotos.filter(p => !p.isUploaded).length > 0 && (
                    <Button
                      onClick={handleUploadAll}
                      size="sm"
                      disabled={isUploading}
                      className="gap-2"
                    >
                      <Upload size={10} />
                      {isUploading ? "Uploading..." : `Upload`}
                    </Button>
                  )}
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
                    <div className="absolute bottom-1 left-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${
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
                      className="absolute text-white right-2 top-2 h-6 rounded-full w-6 "
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
        <div className="space-y-3 ">
          <h4 className="text-sm font-medium text-foreground">
            Uploaded Photos {localPhotos.length > 0 && `(${localPhotos.length})`}
          </h4>
          
          {localPhotos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 bg-secondary p-2 rounded-lg">
              {localPhotos.map((photo, index) => (
                <div
                  key={photo.url}
                  className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-secondary"
                >
                  <img src={photo.url || "/placeholder.svg"} alt={photo.name} className="h-full w-full object-cover" />
                  
                  {/* Loading overlay for deletion */}
                  {deletingPhotoUrl === photo.url && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-white text-black p-2 rounded-full">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  
                  {/* Delete Button - X icon or Clear text */}
                  <div className="absolute right-2 top-2">
                    {clearingPhotoUrl === photo.url ? (
                      <Button
                        variant="destructive" 
                        size="sm"
                        className="text-white px-3 py-1 h-5 text-xs font-medium rounded-full transform transition-all duration-300 ease-out scale-x-110"
                        onClick={() => handleClearClick(photo.url)}
                        disabled={deletingPhotoUrl === photo.url}
                      >
                        Clear
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="text-white h-5 rounded-full w-5 "
                        onClick={() => handleClearClick(photo.url)}
                        disabled={deletingPhotoUrl === photo.url}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    )}
                  </div>
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