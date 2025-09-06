import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formSubmissionsApi, FormSubmissionFilters } from '@/services/formSubmissionsApi';
import { useCallback, useMemo } from 'react';

// Query keys for React Query
export const PRODUCT_EMAIL_QUERY_KEYS = {
  all: ['product-email-analytics'] as const,
  submissions: (filters: FormSubmissionFilters) => 
    [...PRODUCT_EMAIL_QUERY_KEYS.all, 'submissions', filters] as const,
  statistics: () => [...PRODUCT_EMAIL_QUERY_KEYS.all, 'statistics'] as const,
  emailService: () => [...PRODUCT_EMAIL_QUERY_KEYS.all, 'email-service'] as const,
} as const;

// Enhanced interface for product email statistics
interface ProductEmailStats {
  totalRequests: number;
  successfulEmails: number;
  failedEmails: number;
  topProducts: Array<{ productCode: string; count: number }>;
  recentRequests: Array<any>;
  emailServiceStatus: boolean;
  successRate: number;
}

// Hook for fetching product email submissions with optimized filtering
export function useProductEmailSubmissions(filters: FormSubmissionFilters) {
  const queryKey = PRODUCT_EMAIL_QUERY_KEYS.submissions(filters);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await formSubmissionsApi.getSubmissions({
        ...filters,
        formType: 'product_email', // Always filter for product emails
      });
      return response.data;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes for submissions (more frequent updates)
    select: useCallback((data: any) => ({
      items: data.items || [],
      pagination: {
        totalItems: data.totalItems || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.currentPage || 1,
        pageSize: data.pageSize || 10,
      }
    }), []),
  });
}

// Hook for fetching email service status
export function useEmailServiceStatus() {
  return useQuery({
    queryKey: PRODUCT_EMAIL_QUERY_KEYS.emailService(),
    queryFn: async () => {
      const response = await formSubmissionsApi.checkEmailService();
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
    retryDelay: 2000,
  });
}

// Hook for computing statistics with memoization
export function useProductEmailStatistics(submissions: any[]) {
  return useMemo<ProductEmailStats>(() => {
    const productEmailRequests = submissions.filter(req => req.formType === 'product_email');
    
    const totalRequests = productEmailRequests.length;
    const successfulEmails = productEmailRequests.filter(req => req.status === 'sent').length;
    const failedEmails = productEmailRequests.filter(req => req.status === 'failed').length;
    const successRate = totalRequests > 0 ? Math.round((successfulEmails / totalRequests) * 100) : 0;
    
    // Count top products efficiently
    const productCounts = productEmailRequests.reduce((acc, req) => {
      if (req.productCode) {
        acc[req.productCode] = (acc[req.productCode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topProducts = Object.entries(productCounts)
      .map(([productCode, count]) => ({ productCode, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10);
    
    // Get recent requests (last 5)
    const recentRequests = productEmailRequests
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    return {
      totalRequests,
      successfulEmails,
      failedEmails,
      successRate,
      topProducts,
      recentRequests,
      emailServiceStatus: false, // Will be set separately
    };
  }, [submissions]);
}

// Hook for updating submission status with optimistic updates
export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'sent' | 'failed' }) => {
      return await formSubmissionsApi.updateStatus(id, { status });
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all });
      
      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all });
      
      // Optimistically update
      queryClient.setQueriesData({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all }, (old: any) => {
        if (old?.items) {
          return {
            ...old,
            items: old.items.map((item: any) => 
              item.id === id ? { ...item, status } : item
            )
          };
        }
        return old;
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all });
    },
  });
}

// Hook for resending emails
export function useResendEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await formSubmissionsApi.resendEmail(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all });
    },
  });
}

// Hook for deleting submissions
export function useDeleteSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await formSubmissionsApi.deleteSubmission(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all });
      
      const previousData = queryClient.getQueriesData({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all });
      
      // Optimistically remove item
      queryClient.setQueriesData({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all }, (old: any) => {
        if (old?.items) {
          return {
            ...old,
            items: old.items.filter((item: any) => item.id !== id),
            totalItems: old.totalItems - 1,
          };
        }
        return old;
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_EMAIL_QUERY_KEYS.all });
    },
  });
}

// Combined hook for the entire analytics page
export function useProductEmailAnalytics(filters: FormSubmissionFilters) {
  const submissionsQuery = useProductEmailSubmissions(filters);
  const emailServiceQuery = useEmailServiceStatus();
  
  const statistics = useProductEmailStatistics(submissionsQuery.data?.items || []);
  
  // Combine email service status with statistics
  const statsWithEmailService = useMemo(() => ({
    ...statistics,
    emailServiceStatus: emailServiceQuery.data?.emailServiceConnected || false,
  }), [statistics, emailServiceQuery.data]);
  
  return {
    // Data
    submissions: submissionsQuery.data?.items || [],
    pagination: submissionsQuery.data?.pagination,
    statistics: statsWithEmailService,
    emailServiceStatus: emailServiceQuery.data,
    
    // Loading states
    isLoadingSubmissions: submissionsQuery.isLoading,
    isLoadingEmailService: emailServiceQuery.isLoading,
    isLoading: submissionsQuery.isLoading || emailServiceQuery.isLoading,
    
    // Error states
    submissionsError: submissionsQuery.error,
    emailServiceError: emailServiceQuery.error,
    hasError: submissionsQuery.isError || emailServiceQuery.isError,
    
    // Refetch functions
    refetchSubmissions: submissionsQuery.refetch,
    refetchEmailService: emailServiceQuery.refetch,
    refetchAll: () => {
      submissionsQuery.refetch();
      emailServiceQuery.refetch();
    },
    
    // Mutations
    updateStatus: useUpdateSubmissionStatus(),
    resendEmail: useResendEmail(),
    deleteSubmission: useDeleteSubmission(),
  };
}