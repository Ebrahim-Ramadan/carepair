"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
    // Don't close the popover after selection - let user select multiple items
  }

  const handleUnselect = (option: string) => {
    onChange(selected.filter(item => item !== option))
  }

  const clearSearch = () => {
    setSearchValue("")
  }

  // Clear search when popover closes
  React.useEffect(() => {
    if (!open) {
      clearSearch()
    }
  }, [open])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-10 h-auto p-2",
              !selected.length && "text-muted-foreground"
            )}
          >
            <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
              {selected.length > 0 ? (
                selected.map((item) => (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    {item}
                    <X className="h-3 w-3 ml-1 hover:bg-destructive/20 rounded-sm" />
                  </Badge>
                ))
              ) : (
                <span className="text-sm">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0" 
          align="start" 
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div 
            className="p-3"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="relative mb-3">
              <Input
                placeholder="Search parts..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options List */}
            <div className="max-h-64 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchValue ? "No parts found." : "No options available."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredOptions.map((option) => (
                    <div
                      key={option}
                      className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleSelect(option)
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selected.includes(option) ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{option}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Count */}
            {selected.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selected.length} part{selected.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpen(false)
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}