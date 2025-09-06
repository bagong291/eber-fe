import React, { useState, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { useProductEmailAnalytics } from '@/hooks/useProductEmailAnalytics';
import { useProductEmailExport } from '@/hooks/useProductEmailExport';
import {
  AnalyticsHeader,
  StatisticsGrid,
  TopProducts,
  RecentRequests,
  ApiInformation,
} from '@/components/ProductEmailAnalyticsComponents';
import {
  ProductEmailFilters as FilterComponent,
  ProductEmailAnalyticsErrorBoundary,
  AnalyticsLoadingSkeleton,
} from '@/components/ProductEmailFiltersAndErrorBoundary';
import {
  VirtualizedRequestsTable,
  TablePagination,
} from '@/components/VirtualizedRequestsTable';

// Enhanced filter interface
interface ProductEmailFilters {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

const ProductEmailAnalytics = () => {
  // Filter state with optimized defaults
  const [filters, setFilters] = useState<ProductEmailFilters>({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 25,
  });

  // Track which items are being resent
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkResending, setIsBulkResending] = useState(false);

  // Use optimized React Query hooks
  const {
    submissions,
    pagination,
    statistics,
    emailServiceStatus,
    isLoading,
    hasError,
    submissionsError,
    emailServiceError,
    refetchAll,
    updateStatus,
    resendEmail,
    deleteSubmission,
  } = useProductEmailAnalytics(filters);

  // Export functionality
  const { exportCSV, exportJSON, isExporting } = useProductEmailExport();

  // Optimized filter change handler
  const handleFiltersChange = useCallback((newFilters: Partial<ProductEmailFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // Action handlers with optimized updates
  const handleResend = useCallback(async (id: string) => {
    if (!id) {
      toast({
        title: 'Invalid request',
        description: 'Please provide a valid submission ID.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setResendingIds(prev => new Set(prev).add(id));
      await resendEmail.mutateAsync(id);
      
      // Add success visual feedback
      const successElement = document.getElementById(`row-${id}`);
      if (successElement) {
        successElement.classList.add('animate-flash-success');
        setTimeout(() => {
          successElement.classList.remove('animate-flash-success');
        }, 600);
      }
      
      toast({
        title: '✅ Email resent successfully',
        description: 'The product email has been resent to the recipient.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Resend email error:', error);
      let errorMessage = 'An unexpected error occurred.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'You are not authorized to perform this action. Please log in again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Submission not found. It may have been deleted.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: '❌ Failed to resend email',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setResendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [resendEmail]);

  const handleBulkResend = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast({
        title: '⚠️ No requests selected',
        description: 'Please select requests to resend emails.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ Are you sure you want to resend emails for ${selectedIds.size} request(s)?\n\nThis will send emails to all selected recipients.`
    );
    
    if (!confirmed) return;

    try {
      setIsBulkResending(true);
      const results = [];
      
      for (const id of selectedIds) {
        try {
          setResendingIds(prev => new Set(prev).add(id));
          await resendEmail.mutateAsync(id);
          results.push({ id, success: true });
        } catch (error) {
          results.push({ id, success: false, error });
        } finally {
          setResendingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        toast({
          title: `✅ Bulk resend completed`,
          description: `${successful} email(s) resent successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
          duration: 4000,
        });
      }
      
      if (failed > 0) {
        toast({
          title: `❌ Some emails failed`,
          description: `${failed} email(s) failed to resend. Please check individual requests.`,
          variant: 'destructive',
          duration: 5000,
        });
      }
      
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: '❌ Bulk resend failed',
        description: 'An unexpected error occurred during bulk resend operation.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsBulkResending(false);
    }
  }, [selectedIds, resendEmail]);

  const handleSelectionChange = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(submissions.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [submissions]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('⚠️ Are you sure you want to delete this request?\n\nThis action cannot be undone.')) return;
    
    try {
      await deleteSubmission.mutateAsync(id);
      toast({
        title: '🗑️ Request deleted successfully',
        description: 'The email request has been removed.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Failed to delete request',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [deleteSubmission]);

  const handleRefresh = useCallback(async () => {
    try {
      await refetchAll();
      toast({
        title: '🔄 Data refreshed',
        description: 'Analytics data has been updated successfully.',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: '❌ Failed to refresh data',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  }, [refetchAll]);

  const handleExport = useCallback(async () => {
    try {
      toast({
        title: '📤 Exporting data...',
        description: 'Please wait while we prepare your export.',
      });
      
      await exportCSV(filters);
      
      toast({
        title: '✅ Export completed',
        description: 'Your data has been exported successfully.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Export failed',
        description: 'An error occurred while exporting data.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  }, [exportCSV, filters]);

  // Memoized date formatter
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []);

  // Error display component
  const ErrorDisplay = useMemo(() => {
    if (!hasError) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-pulse-soft">
        <h3 className="text-red-800 font-medium mb-2 flex items-center gap-2">
          ⚠️ Error Loading Data
        </h3>
        <div className="space-y-1">
          {submissionsError && (
            <p className="text-red-700 text-sm">
              📧 Submissions: {submissionsError.message}
            </p>
          )}
          {emailServiceError && (
            <p className="text-red-700 text-sm">
              🔧 Email Service: {emailServiceError.message}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          🔄 Retry
        </button>
      </div>
    );
  }, [hasError, submissionsError, emailServiceError, handleRefresh]);

  // Show loading skeleton on initial load
  if (isLoading && !submissions.length) {
    return (
      <div className="space-y-6">
        <AnalyticsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnalyticsHeader
        emailServiceConnected={emailServiceStatus?.emailServiceConnected}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />

      {/* Error Display */}
      {ErrorDisplay}

      {/* Statistics Cards */}
      <StatisticsGrid
        stats={statistics}
        isLoading={isLoading}
      />

      {/* Filters */}
      <FilterComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
      />

      {/* Top Products and Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProducts
          products={statistics.topProducts}
          isLoading={isLoading}
        />
        <RecentRequests
          requests={statistics.recentRequests}
          isLoading={isLoading}
          formatDate={formatDate}
        />
      </div>

      {/* Virtualized Table */}
      <VirtualizedRequestsTable
        requests={submissions}
        isLoading={isLoading}
        formatDate={formatDate}
        onResend={handleResend}
        onDelete={handleDelete}
        onExport={handleExport}
        height={500}
        resendingIds={resendingIds}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onBulkResend={handleBulkResend}
        isBulkResending={isBulkResending}
      />

      {/* Pagination */}
      {pagination && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}

      {/* API Information */}
      <ApiInformation />
    </div>
  );
};

// Wrap with error boundary
const ProductEmailAnalyticsWithErrorBoundary = () => (
  <ProductEmailAnalyticsErrorBoundary>
    <ProductEmailAnalytics />
  </ProductEmailAnalyticsErrorBoundary>
);

export default ProductEmailAnalyticsWithErrorBoundary;