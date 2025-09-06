import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { formSubmissionsApi, FormSubmissionFilters } from '@/services/formSubmissionsApi';
import { toast } from '@/hooks/use-toast';

// Export formats
export type ExportFormat = 'csv' | 'json' | 'xlsx';

interface ExportRequest {
  filters: FormSubmissionFilters;
  format: ExportFormat;
  includeHeaders?: boolean;
  fileName?: string;
}

// CSV export utility
function convertToCSV(data: any[], headers?: string[]): string {
  if (!data.length) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// JSON export utility
function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

// File download utility
function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export service
class ProductEmailExportService {
  static async fetchAllData(filters: FormSubmissionFilters): Promise<any[]> {
    let allData: any[] = [];
    let currentPage = 1;
    const pageSize = 100; // Fetch in chunks
    
    while (true) {
      const response = await formSubmissionsApi.getSubmissions({
        ...filters,
        formType: 'product_email',
        page: currentPage,
        pageSize
      });
      
      if (!response.data.items.length) break;
      
      allData = [...allData, ...response.data.items];
      
      // Check if we've fetched all data
      if (response.data.items.length < pageSize) break;
      
      currentPage++;
    }
    
    return allData;
  }

  static processDataForExport(data: any[]): any[] {
    return data.map(item => ({
      id: item.id,
      email: item.email,
      productCode: item.productCode || '',
      status: item.status,
      timestamp: new Date(item.createdAt).toISOString(),
      ipAddress: item.ipAddress || '',
      userAgent: item.userAgent || '',
      formType: item.formType,
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      phone: item.phone || '',
      company: item.company || '',
      city: item.city || '',
      subject: item.subject || '',
      message: item.message || '',
    }));
  }

  static async exportData({ filters, format, includeHeaders = true, fileName }: ExportRequest): Promise<void> {
    try {
      // Show loading toast
      const loadingToast = toast({
        title: 'Exporting data...',
        description: 'Please wait while we prepare your export.',
        duration: 0, // Keep until manually dismissed
      });

      // Fetch all data
      const rawData = await this.fetchAllData(filters);
      const processedData = this.processDataForExport(rawData);

      if (!processedData.length) {
        toast({
          title: 'No data to export',
          description: 'No records match your current filters.',
          variant: 'destructive',
        });
        return;
      }

      // Generate file name if not provided
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFileName = `product-email-analytics-${timestamp}`;
      const finalFileName = fileName || defaultFileName;

      let content: string;
      let mimeType: string;
      let fileExtension: string;

      switch (format) {
        case 'csv':
          content = convertToCSV(processedData);
          mimeType = 'text/csv;charset=utf-8;';
          fileExtension = 'csv';
          break;

        case 'json':
          content = convertToJSON(processedData);
          mimeType = 'application/json;charset=utf-8;';
          fileExtension = 'json';
          break;

        case 'xlsx':
          // For XLSX, we'd need a library like SheetJS
          // For now, fallback to CSV
          content = convertToCSV(processedData);
          mimeType = 'text/csv;charset=utf-8;';
          fileExtension = 'csv';
          toast({
            title: 'XLSX not supported',
            description: 'Exporting as CSV instead.',
            variant: 'default',
          });
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Download file
      downloadFile(content, `${finalFileName}.${fileExtension}`, mimeType);

      // Dismiss loading toast and show success
      loadingToast.dismiss?.();
      toast({
        title: 'Export successful',
        description: `Downloaded ${processedData.length} records as ${fileExtension.toUpperCase()}.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  }
}

// React hook for data export
export function useProductEmailExport() {
  const exportMutation = useMutation({
    mutationFn: ProductEmailExportService.exportData,
    onError: (error) => {
      console.error('Export mutation error:', error);
    },
  });

  const exportData = useCallback(async (request: ExportRequest) => {
    return exportMutation.mutateAsync(request);
  }, [exportMutation]);

  const exportCSV = useCallback((filters: FormSubmissionFilters, fileName?: string) => {
    return exportData({
      filters,
      format: 'csv',
      includeHeaders: true,
      fileName,
    });
  }, [exportData]);

  const exportJSON = useCallback((filters: FormSubmissionFilters, fileName?: string) => {
    return exportData({
      filters,
      format: 'json',
      fileName,
    });
  }, [exportData]);

  return {
    exportData,
    exportCSV,
    exportJSON,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error,
  };
}

// Background export with Web Workers (for large datasets)
class BackgroundExportWorker {
  private worker: Worker | null = null;

  constructor() {
    // Create worker if supported
    if (typeof Worker !== 'undefined') {
      try {
        const workerScript = `
          self.onmessage = function(e) {
            const { data, format } = e.data;
            
            let result;
            try {
              switch (format) {
                case 'csv':
                  result = convertToCSV(data);
                  break;
                case 'json':
                  result = JSON.stringify(data, null, 2);
                  break;
                default:
                  throw new Error('Unsupported format');
              }
              
              self.postMessage({ success: true, result });
            } catch (error) {
              self.postMessage({ success: false, error: error.message });
            }
          };
          
          function convertToCSV(data) {
            if (!data.length) return '';
            
            const headers = Object.keys(data[0]);
            const csvContent = [
              headers.join(','),
              ...data.map(row => 
                headers.map(header => {
                  const value = row[header];
                  if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return '"' + value.replace(/"/g, '""') + '"';
                  }
                  return value ?? '';
                }).join(',')
              )
            ].join('\\n');
            
            return csvContent;
          }
        `;
        
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
      } catch (error) {
        console.warn('Web Worker not available, falling back to main thread processing');
      }
    }
  }

  async processData(data: any[], format: ExportFormat): Promise<string> {
    if (!this.worker) {
      // Fallback to main thread
      switch (format) {
        case 'csv':
          return convertToCSV(data);
        case 'json':
          return convertToJSON(data);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      this.worker.onmessage = (e) => {
        const { success, result, error } = e.data;
        if (success) {
          resolve(result);
        } else {
          reject(new Error(error));
        }
      };

      this.worker.onerror = (error) => {
        reject(error);
      };

      this.worker.postMessage({ data, format });
    });
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Hook for background export
export function useBackgroundExport() {
  const worker = React.useRef<BackgroundExportWorker | null>(null);

  React.useEffect(() => {
    worker.current = new BackgroundExportWorker();
    
    return () => {
      worker.current?.destroy();
    };
  }, []);

  const exportInBackground = useCallback(async (request: ExportRequest) => {
    if (!worker.current) {
      throw new Error('Background worker not available');
    }

    try {
      const rawData = await ProductEmailExportService.fetchAllData(request.filters);
      const processedData = ProductEmailExportService.processDataForExport(rawData);
      
      const content = await worker.current.processData(processedData, request.format);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = request.fileName || `product-email-analytics-${timestamp}`;
      const mimeType = request.format === 'json' ? 'application/json' : 'text/csv';
      
      downloadFile(content, `${fileName}.${request.format}`, mimeType);
      
      return { success: true, recordCount: processedData.length };
    } catch (error) {
      console.error('Background export error:', error);
      throw error;
    }
  }, []);

  return {
    exportInBackground,
    isWorkerSupported: !!worker.current,
  };
}