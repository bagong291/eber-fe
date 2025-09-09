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
import SearchableMultiSelect from '@/components/ui/SearchableMultiSelect'
import VirtualizedMultiSelect from '@/components/ui/VirtualizedMultiSelect'

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
  // Convert filter options to the format expected by the multi-select components
  const typeOptions = filterOptions.types.map(type => ({ value: type, label: type }))
  const applicationOptions = filterOptions.applications.map(app => ({ value: app, label: app }))

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
          {/* Use VirtualizedMultiSelect if many options, otherwise use SearchableMultiSelect */}
          {typeOptions.length > 100 ? (
            <VirtualizedMultiSelect
              options={typeOptions}
              selectedValues={selectedTypes}
              onSelectionChange={onTypeChange}
              placeholder={isLoading ? "Loading..." : "Select Types"}
              disabled={isLoading}
              className="w-48"
              maxHeight={200}
              virtualizationThreshold={50}
            />
          ) : (
            <SearchableMultiSelect
              options={typeOptions}
              selectedValues={selectedTypes}
              onSelectionChange={onTypeChange}
              placeholder={isLoading ? "Loading..." : "Select Types"}
              disabled={isLoading}
              className="w-48"
              maxHeight="200px"
            />
          )}
        </div>

        {/* Application Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Application</label>
          {/* Use VirtualizedMultiSelect if many options, otherwise use SearchableMultiSelect */}
          {applicationOptions.length > 100 ? (
            <VirtualizedMultiSelect
              options={applicationOptions}
              selectedValues={selectedApplications}
              onSelectionChange={onApplicationChange}
              placeholder={isLoading ? "Loading..." : "Select Applications"}
              disabled={isLoading}
              className="w-48"
              maxHeight={200}
              virtualizationThreshold={50}
            />
          ) : (
            <SearchableMultiSelect
              options={applicationOptions}
              selectedValues={selectedApplications}
              onSelectionChange={onApplicationChange}
              placeholder={isLoading ? "Loading..." : "Select Applications"}
              disabled={isLoading}
              className="w-48"
              maxHeight="200px"
            />
          )}
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