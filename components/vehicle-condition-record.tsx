"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RotateCcw, Save, Trash2 } from "lucide-react"
import type { DamagePoint } from "@/lib/types"

type VehicleConditionRecordProps = {
  points?: DamagePoint[]
  onPointsChange: (points: DamagePoint[]) => void
}

export function VehicleConditionRecord({ points, onPointsChange }: VehicleConditionRecordProps) {
  const [localPoints, setLocalPoints] = useState<DamagePoint[]>(points ?? [])
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [hoveredExistingPointId, setHoveredExistingPointId] = useState<string | null>(null)

  useEffect(() => {
    if (!points) return
    if (hasUnsavedChanges) return
    setLocalPoints(points)
    setHasUnsavedChanges(false)
  }, [points, hasUnsavedChanges])

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Toggle logic: if clicking close to an existing point, remove it; otherwise add new
    const threshold = 2 // percent units distance threshold
    const existing = localPoints.find((p) => {
      const dx = p.x - x
      const dy = p.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      return dist <= threshold
    })

    if (existing) {
      const updated = localPoints
        .filter((p) => p.id !== existing.id)
        .map((p, index) => ({ ...p, number: index + 1 }))
      setLocalPoints(updated)
      if (selectedPoint === existing.id) setSelectedPoint(null)
      setHasUnsavedChanges(true)
      return
    }

    const newPoint: DamagePoint = {
      id: crypto.randomUUID(),
      x,
      y,
      number: localPoints.length + 1,
      description: "",
    }
    setLocalPoints([...localPoints, newPoint])
    setSelectedPoint(newPoint.id)
    setHasUnsavedChanges(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const threshold = 2
    const existing = localPoints.find((p) => {
      const dx = p.x - x
      const dy = p.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      return dist <= threshold
    })
    setHoveredExistingPointId(existing ? existing.id : null)
  }

  const handleMouseLeave = () => {
    setHoveredExistingPointId(null)
  }

  const handleDescriptionChange = (id: string, description: string) => {
    setLocalPoints(localPoints.map((point) => (point.id === id ? { ...point, description } : point)))
    setHasUnsavedChanges(true)
  }

  const handleDeletePoint = (id: string) => {
    const updatedPoints = localPoints
      .filter((point) => point.id !== id)
      .map((point, index) => ({ ...point, number: index + 1 }))
    setLocalPoints(updatedPoints)
    setHasUnsavedChanges(true)
    if (selectedPoint === id) {
      setSelectedPoint(null)
    }
  }

  const handleSave = () => {
    onPointsChange(localPoints)
    setHasUnsavedChanges(false)
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all vehicle condition records?")) {
      setLocalPoints([])
      onPointsChange([])
      setSelectedPoint(null)
      setHasUnsavedChanges(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 w-full">
          <h3 className="text-lg font-semibold text-foreground">Vehicle Condition Record</h3>
          {hasUnsavedChanges && <span className="text-xs text-amber-500">● Unsaved changes</span>}
        </div>
        <div className="flex gap-2 justify-end w-full">
          <Button variant="default" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={localPoints.length === 0}
            className="gap-2 bg-transparent"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Canvas */}
        <div className="relative">
          <div
            ref={canvasRef}
            className={`relative overflow-hidden rounded-lg border border-border bg-secondary ${
              hoveredExistingPointId ? "cursor-not-allowed" : "cursor-crosshair"
            }`}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img src="/car-diagram.png" alt="Car diagram" className="w-full" draggable={false} />
            {localPoints.map((point) => (
              <div
                key={point.id}
                className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg ring-2 ring-background"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                {point.number}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs leading-tight">
            Click anywhere on the vehicle to mark condition points
          </p>
        </div>

        {/* Points List */}
        {localPoints.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Condition Points</h4>
            <div className="space-y-3">
              {localPoints.map((point) => (
                <div
                  key={point.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectedPoint === point.id ? "border-primary bg-primary/10" : "border-border bg-secondary"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Label htmlFor={`point-${point.id}`}>Point {point.number}</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeletePoint(point.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    id={`point-${point.id}`}
                    value={point.description}
                    onChange={(e) => handleDescriptionChange(point.id, e.target.value)}
                    placeholder="Describe the damage or condition..."
                    onFocus={() => setSelectedPoint(point.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
