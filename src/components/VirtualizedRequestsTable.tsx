import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductEmailRequest {
  id: string;
  email: string;
  productCode: string;
  status: 'sent' | 'failed';
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface VirtualizedTableProps {
  requests: ProductEmailRequest[];
  isLoading?: boolean;
  formatDate: (dateString: string) => string;
  onResend?: (id: string) => void;
  onDelete?: (id: string) => void;
  onExport?: () => void;
  height?: number;
  resendingIds?: Set<string>; // Track which items are being resent
  selectedIds?: Set<string>; // Track which items are selected
  onSelectionChange?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onBulkResend?: () => void;
  isBulkResending?: boolean;
}

// Individual table row component
interface TableRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    requests: ProductEmailRequest[];
    formatDate: (dateString: string) => string;
    onResend?: (id: string) => void;
    onDelete?: (id: string) => void;
    resendingIds?: Set<string>;
    selectedIds?: Set<string>;
    onSelectionChange?: (id: string, selected: boolean) => void;
  };
}

const TableRow = memo<TableRowProps>(({ index, style, data }) => {
  const { requests, formatDate, onResend, onDelete, resendingIds, selectedIds, onSelectionChange } = data;
  const request = requests[index];
  const isResending = resendingIds?.has(request?.id) || false;
  const isSelected = selectedIds?.has(request?.id) || false;

  const handleResend = useCallback(() => {
    if (!isResending) {
      onResend?.(request.id);
    }
  }, [onResend, request.id, isResending]);

  const handleDelete = useCallback(() => {
    onDelete?.(request.id);
  }, [onDelete, request.id]);

  const handleSelectionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange?.(request.id, e.target.checked);
  }, [onSelectionChange, request.id]);

  if (!request) return null;

  return (
    <div 
      style={style} 
      className={`flex items-center border-b border-gray-200 hover:bg-gray-50 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      } ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
      id={`row-${request.id}`}
    >
      {/* Selection Checkbox */}
      {onSelectionChange && (
        <div className="w-[40px] px-2 py-2 flex justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionChange}
            className="rounded border-gray-300 transition-all duration-200 hover:scale-110"
            disabled={isResending}
          />
        </div>
      )}
      {/* Email Column */}
      <div className="flex-1 px-4 py-2 min-w-[200px] truncate">
        <span className="text-sm" title={request.email}>
          {request.email}
        </span>
      </div>
      
      {/* Product Code Column */}
      <div className="flex-1 px-4 py-2 min-w-[150px]">
        <span className="font-mono text-sm" title={request.productCode}>
          {request.productCode}
        </span>
      </div>
      
      {/* Status Column */}
      <div className="flex-1 px-4 py-2 min-w-[100px]">
        <Badge 
          variant={request.status === 'sent' ? 'secondary' : 'destructive'}
          className={`text-xs transition-all duration-300 ${
            isResending ? 'animate-pulse bg-blue-100 text-blue-800' : ''
          }`}
        >
          {isResending ? 'Resending...' : (request.status === 'sent' ? 'Sent' : 'Failed')}
        </Badge>
      </div>
      
      {/* Timestamp Column */}
      <div className="flex-1 px-4 py-2 min-w-[150px]">
        <span className="text-xs text-gray-500">
          {formatDate(request.createdAt)}
        </span>
      </div>
      
      {/* IP Address Column */}
      <div className="flex-1 px-4 py-2 min-w-[120px]">
        <span className="text-xs text-gray-600" title={request.ipAddress}>
          {request.ipAddress || 'N/A'}
        </span>
      </div>
      
      {/* Actions Column */}
      <div className="w-[80px] px-4 py-2 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 w-8 p-0 transition-all duration-200 ${
                isResending ? 'animate-spin' : 'hover:bg-gray-100'
              }`}
              disabled={isResending}
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {request.status === 'failed' && onResend && (
              <DropdownMenuItem 
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="animate-pulse">Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend
                  </>
                )}
              </DropdownMenuItem>
            )}
            {request.status === 'sent' && onResend && (
              <DropdownMenuItem 
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="animate-pulse">Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Again
                  </>
                )}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

TableRow.displayName = 'TableRow';

// Table header component
const TableHeader = memo<{ 
  onSelectAll?: (selected: boolean) => void;
  selectedCount?: number;
  totalCount?: number;
}>(({ onSelectAll, selectedCount = 0, totalCount = 0 }) => (
  <div className="flex items-center border-b-2 border-gray-300 bg-gray-50 font-medium text-sm">
    {onSelectAll && (
      <div className="w-[40px] px-2 py-3 flex justify-center">
        <input
          type="checkbox"
          checked={selectedCount === totalCount && totalCount > 0}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="rounded border-gray-300"
        />
      </div>
    )}
    <div className="flex-1 px-4 py-3 min-w-[200px]">Email</div>
    <div className="flex-1 px-4 py-3 min-w-[150px]">Product Code</div>
    <div className="flex-1 px-4 py-3 min-w-[100px]">Status</div>
    <div className="flex-1 px-4 py-3 min-w-[150px]">Timestamp</div>
    <div className="flex-1 px-4 py-3 min-w-[120px]">IP Address</div>
    <div className="w-[80px] px-4 py-3 text-center">Actions</div>
  </div>
));

TableHeader.displayName = 'TableHeader';

// Loading row component with enhanced animation
const LoadingRow = memo<{ style: React.CSSProperties; hasSelection?: boolean }>(({ style, hasSelection = false }) => (
  <div style={style} className="flex items-center border-b border-gray-200 animate-pulse">
    {hasSelection && (
      <div className="w-[40px] px-2 py-2">
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </div>
    )}
    <div className="flex-1 px-4 py-2 min-w-[200px]">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
    </div>
    <div className="flex-1 px-4 py-2 min-w-[150px]">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.1s' }}></div>
    </div>
    <div className="flex-1 px-4 py-2 min-w-[100px]">
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full w-16 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}></div>
    </div>
    <div className="flex-1 px-4 py-2 min-w-[150px]">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }}></div>
    </div>
    <div className="flex-1 px-4 py-2 min-w-[120px]">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}></div>
    </div>
    <div className="w-[80px] px-4 py-2">
      <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}></div>
    </div>
  </div>
));

LoadingRow.displayName = 'LoadingRow';

// Main virtualized table component
export const VirtualizedRequestsTable = memo<VirtualizedTableProps>(({
  requests,
  isLoading = false,
  formatDate,
  onResend,
  onDelete,
  onExport,
  height = 400,
  resendingIds = new Set(),
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  onBulkResend,
  isBulkResending = false
}) => {
  const itemData = useMemo(() => ({
    requests,
    formatDate,
    onResend,
    onDelete,
    resendingIds,
    selectedIds,
    onSelectionChange
  }), [requests, formatDate, onResend, onDelete, resendingIds, selectedIds, onSelectionChange]);

  const itemCount = isLoading ? 10 : requests.length;
  const itemSize = 60; // Height of each row
  const hasSelection = onSelectionChange !== undefined;

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (isLoading) {
      return <LoadingRow style={style} hasSelection={hasSelection} />;
    }
    return <TableRow index={index} style={style} data={itemData} />;
  }, [isLoading, itemData, hasSelection]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>All Product Email Requests</CardTitle>
          {onSelectionChange && selectedIds.size > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedIds.size} of {requests.length} selected
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSelectionChange && selectedIds.size > 0 && onBulkResend && (
            <Button 
              onClick={onBulkResend}
              disabled={isBulkResending}
              size="sm"
              className="transition-all duration-200 hover:scale-105"
            >
              {isBulkResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Bulk Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Bulk Resend ({selectedIds.size})
                </>
              )}
            </Button>
          )}
          {onExport && (
            <Button 
              onClick={onExport} 
              variant="outline" 
              size="sm"
              className="transition-all duration-200 hover:scale-105"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Badge 
            variant="secondary"
            className="transition-all duration-300 hover:scale-105"
          >
            {requests.length} {requests.length === 1 ? 'request' : 'requests'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-hidden">
          <TableHeader 
            onSelectAll={onSelectAll}
            selectedCount={selectedIds.size}
            totalCount={requests.length}
          />
          
          {isLoading || requests.length > 0 ? (
            <FixedSizeList
              height={height}
              itemCount={itemCount}
              itemSize={itemSize}
              width="100%"
            >
              {Row}
            </FixedSizeList>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No requests found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

VirtualizedRequestsTable.displayName = 'VirtualizedRequestsTable';

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export const TablePagination = memo<PaginationProps>(({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  isLoading = false
}) => {
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(e.target.value, 10));
  }, [onPageSizeChange]);

  return (
    <div className="flex flex-col items-center justify-between gap-4 mt-4 p-4 bg-white border-t">
      <div className="flex items-center space-x-4">
        <Button 
          size="sm" 
          variant="outline" 
          disabled={currentPage <= 1 || isLoading} 
          onClick={handlePrevious}
        >
          Previous
        </Button>
        
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages} ({totalItems} total)
        </span>
        
        <Button 
          size="sm" 
          variant="outline" 
          disabled={currentPage >= totalPages || isLoading} 
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">Rows per page:</label>
        <select
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={isLoading}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
});

TablePagination.displayName = 'TablePagination';