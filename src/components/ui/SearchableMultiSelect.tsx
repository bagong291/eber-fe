import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface SearchableMultiSelectProps {
  options: Option[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  maxHeight?: string
  showSearch?: boolean
  showSelectAll?: boolean
  maxDisplayedTags?: number
}

export default function SearchableMultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select items...",
  emptyText = "No options available",
  disabled = false,
  className,
  maxHeight = "200px",
  showSearch = true,
  showSelectAll = true,
  maxDisplayedTags = 3
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen, showSearch])

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value))
    } else {
      onSelectionChange([...selectedValues, value])
    }
  }

  const handleSelectAll = () => {
    if (selectedValues.length === filteredOptions.length) {
      // Deselect all filtered options
      const remainingValues = selectedValues.filter(value => 
        !filteredOptions.some(option => option.value === value)
      )
      onSelectionChange(remainingValues)
    } else {
      // Select all filtered options
      const allFilteredValues = filteredOptions.map(option => option.value)
      const newSelected = [...new Set([...selectedValues, ...allFilteredValues])]
      onSelectionChange(newSelected)
    }
  }

  const handleClearAll = () => {
    onSelectionChange([])
  }

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0])
      return option?.label || selectedValues[0]
    }
    return `${selectedValues.length} selected`
  }

  const selectedOptions = selectedValues.map(value => 
    options.find(opt => opt.value === value) || { value, label: value }
  )

  const displayedTags = selectedOptions.slice(0, maxDisplayedTags)
  const hiddenTagsCount = selectedOptions.length - maxDisplayedTags

  const allFilteredSelected = filteredOptions.length > 0 && 
    filteredOptions.every(option => selectedValues.includes(option.value))

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className="truncate text-left flex-1">
          {getDisplayText()}
        </span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Selected Tags (when closed) */}
      {selectedValues.length > 0 && !isOpen && (
        <div className="flex flex-wrap gap-1 mt-2">
          {displayedTags.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-xs gap-1"
            >
              {option.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleOption(option.value)
                }}
                className="hover:text-red-500"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {hiddenTagsCount > 0 && (
            <Badge variant="outline" className="text-xs">
              +{hiddenTagsCount} more
            </Badge>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {/* Search Input */}
          {showSearch && (
            <div className="border-b p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showSelectAll && filteredOptions.length > 0 && (
            <div className="border-b p-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 text-xs"
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
                {searchTerm && ` (${filteredOptions.length})`}
              </Button>
              {selectedValues.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
            </div>
          )}

          {/* Options List */}
          <div 
            className="overflow-y-auto p-1"
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm ? `No results for "${searchTerm}"` : emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 text-sm cursor-pointer rounded-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50"
                    )}
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSelected 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-input"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1 truncate">{option.label}</span>
                  </div>
                )
              })
            )}
          </div>

          {/* Results Summary */}
          {searchTerm && (
            <div className="border-t p-2 text-xs text-muted-foreground text-center">
              Showing {filteredOptions.length} of {options.length} options
            </div>
          )}
        </div>
      )}
    </div>
  )
}
