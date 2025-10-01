"use client"

import * as React from "react"
import { X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: string[]
  placeholder?: string
  label?: string
  allowCustom?: boolean
  className?: string
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select items...",
  label,
  allowCustom = false,
  className
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [customValue, setCustomValue] = React.useState("")
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustomInput(false)
        setCustomValue("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(item => item !== option))
    } else {
      onChange([...value, option])
    }
  }

  const handleRemoveItem = (item: string) => {
    onChange(value.filter(v => v !== item))
  }

  const handleAddCustom = () => {
    if (customValue.trim() && !value.includes(customValue.trim())) {
      onChange([...value, customValue.trim()])
      setCustomValue("")
      setShowCustomInput(false)
    }
  }

  const availableOptions = options.filter(option => !value.includes(option))

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      )}
      
      {/* Selected items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="flex items-center gap-1">
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="ml-1 h-3 w-3 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-start text-left font-normal"
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span>{value.length} item{value.length !== 1 ? 's' : ''} selected</span>
          )}
        </Button>

        {/* Dropdown content */}
        {isOpen && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {availableOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggleOption(option)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span>{option}</span>
                  {value.includes(option) && <Check className="h-4 w-4" />}
                </button>
              ))}
              
              {availableOptions.length === 0 && !allowCustom && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No more options available
                </div>
              )}
            </div>

            {/* Custom input section */}
            {allowCustom && (
              <div className="border-t border-border pt-2 mt-2">
                {!showCustomInput ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add custom item
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="Enter custom item..."
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddCustom()
                        } else if (e.key === "Escape") {
                          setShowCustomInput(false)
                          setCustomValue("")
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustom}
                      disabled={!customValue.trim()}
                      className="h-8 px-2"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}