import React, { memo, useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

// Filter interfaces
export interface ProductEmailFilters {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

interface FilterComponentProps {
  filters: ProductEmailFilters;
  onFiltersChange: (filters: Partial<ProductEmailFilters>) => void;
  isLoading?: boolean;
}

// Debounced search input component
const DebouncedSearchInput = memo<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}>(({ value, onChange, placeholder = "Search by email or product code...", isLoading }) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 500);

  React.useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
        disabled={isLoading}
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

DebouncedSearchInput.displayName = 'DebouncedSearchInput';

// Date range picker component
const DateRangePicker = memo<{
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  isLoading?: boolean;
}>(({ dateFrom, dateTo, onDateFromChange, onDateToChange, isLoading }) => (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label htmlFor="dateFrom">From Date</Label>
      <Input
        id="dateFrom"
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        disabled={isLoading}
      />
    </div>
    <div>
      <Label htmlFor="dateTo">To Date</Label>
      <Input
        id="dateTo"
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        disabled={isLoading}
        min={dateFrom || undefined}
      />
    </div>
  </div>
));

DateRangePicker.displayName = 'DateRangePicker';

// Status filter component
const StatusFilter = memo<{
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}>(({ value, onChange, isLoading }) => (
  <div>
    <Label htmlFor="status">Status</Label>
    <Select
      value={value || 'all'}
      onValueChange={(newValue) => onChange(newValue === 'all' ? '' : newValue)}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="sent">Successfully Sent</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
      </SelectContent>
    </Select>
  </div>
));

StatusFilter.displayName = 'StatusFilter';

// Main filter component with optimized performance
export const ProductEmailFilters = memo<FilterComponentProps>(({ 
  filters, 
  onFiltersChange, 
  isLoading = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Optimized change handlers
  const handleSearchChange = useCallback((search: string) => {
    onFiltersChange({ search, page: 1 }); // Reset to page 1 on search
  }, [onFiltersChange]);

  const handleStatusChange = useCallback((status: string) => {
    onFiltersChange({ status, page: 1 });
  }, [onFiltersChange]);

  const handleDateFromChange = useCallback((dateFrom: string) => {
    onFiltersChange({ dateFrom, page: 1 });
  }, [onFiltersChange]);

  const handleDateToChange = useCallback((dateTo: string) => {
    onFiltersChange({ dateTo, page: 1 });
  }, [onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      page: 1
    });
    setIsExpanded(false);
  }, [onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => 
    filters.search || filters.status || filters.dateFrom || filters.dateTo,
    [filters.search, filters.status, filters.dateFrom, filters.dateTo]
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Always visible search bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <DebouncedSearchInput
              value={filters.search}
              onChange={handleSearchChange}
              isLoading={isLoading}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-6"
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Hide Filters' : 'More Filters'}
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="mt-6"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible advanced filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <StatusFilter
              value={filters.status}
              onChange={handleStatusChange}
              isLoading={isLoading}
            />
            <div className="md:col-span-2">
              <Label>Date Range</Label>
              <DateRangePicker
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.search && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: {filters.search}
              </span>
            )}
            {filters.status && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Status: {filters.status}
              </span>
            )}
            {filters.dateFrom && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                From: {filters.dateFrom}
              </span>
            )}
            {filters.dateTo && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                To: {filters.dateTo}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ProductEmailFilters.displayName = 'ProductEmailFilters';

// Error Boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ProductEmailAnalyticsErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProductEmailAnalytics Error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback = memo<{ error?: Error; resetError: () => void }>(({ 
  error, 
  resetError 
}) => (
  <Card className="border-red-200">
    <CardContent className="p-6 text-center">
      <div className="text-red-600 mb-4">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm mt-2">
          {error?.message || 'An unexpected error occurred in the analytics page'}
        </p>
      </div>
      <Button onClick={resetError} variant="outline" size="sm">
        Try Again
      </Button>
    </CardContent>
  </Card>
));

DefaultErrorFallback.displayName = 'DefaultErrorFallback';

// Loading skeleton component
export const AnalyticsLoadingSkeleton = memo(() => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

AnalyticsLoadingSkeleton.displayName = 'AnalyticsLoadingSkeleton';