import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Filter, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface ProductFiltersProps {
  filterOptions: {
    types: string[]
    applications: string[]
  }
  selectedTypes: string[]
  selectedApplications: string[]
  statusFilter: 'all' | 'active' | 'inactive'
  search: string
  onTypeChange: (types: string[]) => void
  onApplicationChange: (applications: string[]) => void
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void
  onSearchChange: (search: string) => void
  onClearAll: () => void
  isLoading?: boolean
}

export default function ProductFilters({
  filterOptions,
  selectedTypes,
  selectedApplications,
  statusFilter,
  search,
  onTypeChange,
  onApplicationChange,
  onStatusChange,
  onSearchChange,
  onClearAll,
  isLoading = false,
}: ProductFiltersProps) {
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement>(null)
  const applicationDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false)
      }
      if (applicationDropdownRef.current && !applicationDropdownRef.current.contains(event.target as Node)) {
        setIsApplicationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTypeSelect = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter(t => t !== type))
    } else {
      onTypeChange([...selectedTypes, type])
    }
  }

  const handleApplicationSelect = (application: string) => {
    if (selectedApplications.includes(application)) {
      onApplicationChange(selectedApplications.filter(a => a !== application))
    } else {
      onApplicationChange([...selectedApplications, application])
    }
  }

  const hasActiveFilters = search.trim() !== '' || selectedTypes.length > 0 || selectedApplications.length > 0 || statusFilter !== 'all'

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* Filter Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
          ) : (
            <Filter className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        {/* Search Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <Input
            className="w-64"
            placeholder="Search products..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Type Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Type</label>
          <div className="relative" ref={typeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              disabled={isLoading}
              className="flex h-10 w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="truncate">
                {isLoading 
                  ? "Loading..." 
                  : selectedTypes.length > 0 
                    ? `${selectedTypes.length} selected`
                    : "Select Types"
                }
              </span>
              <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isTypeOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {filterOptions.types.map((type) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
                    onClick={() => handleTypeSelect(type)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      readOnly
                      className="h-4 w-4"
                    />
                    <span className="flex-1">{type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Application Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Application</label>
          <div className="relative" ref={applicationDropdownRef}>
            <button
              type="button"
              onClick={() => setIsApplicationOpen(!isApplicationOpen)}
              disabled={isLoading}
              className="flex h-10 w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="truncate">
                {isLoading 
                  ? "Loading..." 
                  : selectedApplications.length > 0 
                    ? `${selectedApplications.length} selected`
                    : "Select Applications"
                }
              </span>
              <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isApplicationOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {filterOptions.applications.map((application) => (
                  <div
                    key={application}
                    className="flex items-center gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
                    onClick={() => handleApplicationSelect(application)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application)}
                      readOnly
                      className="h-4 w-4"
                    />
                    <span className="flex-1">{application}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <Select value={statusFilter} onValueChange={onStatusChange} disabled={isLoading}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700"
              disabled={isLoading}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-600 mr-2">Active filters:</span>
          {search.trim() !== '' && (
            <Badge variant="secondary" className="gap-1">
              Search: "{search}"
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onSearchChange('')}
              />
            </Badge>
          )}
          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              Type: {type}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => handleTypeSelect(type)}
              />
            </Badge>
          ))}
          {selectedApplications.map((application) => (
            <Badge key={application} variant="secondary" className="gap-1">
              App: {application}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => handleApplicationSelect(application)}
              />
            </Badge>
          ))}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter === 'active' ? 'Active' : 'Inactive'}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onStatusChange('all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 