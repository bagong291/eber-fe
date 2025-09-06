// Form Submissions API service
import apiClient from './apiClient';
import { FormSubmission } from '@/store/dataStore';

export interface FormSubmissionFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  formType?: string;
  status?: string;
  email?: string;
  company?: string;
  productCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FormSubmissionResponse {
  status: string;
  data: {
    items: FormSubmission[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface FormSubmissionStatsResponse {
  status: string;
  data: {
    totalSubmissions: number;
    byFormType: Array<{ formType: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    recentSubmissions: FormSubmission[];
  };
}

export interface EmailServiceCheckResponse {
  status: string;
  data: {
    emailServiceConnected: boolean;
    error?: string;
  };
}

export interface StatusUpdateRequest {
  status: 'sent' | 'failed';
}

export interface CustomResponseRequest {
  subject: string;
  message: string;
}

export interface ActionResponse {
  status: string;
  message: string;
  data?: {
    emailSent?: boolean;
    messageId?: string;
  };
}

export const formSubmissionsApi = {
  // Get all form submissions with filtering
  getSubmissions: async (filters: FormSubmissionFilters = {}): Promise<FormSubmissionResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/form-submissions/admin?${params.toString()}`);
    return response.data;
  },

  // Get form submission by ID
  getSubmissionById: async (id: string): Promise<{ status: string; data: FormSubmission }> => {
    const response = await apiClient.get(`/form-submissions/admin/${id}`);
    return response.data;
  },

  // Get form submission statistics
  getStatistics: async (): Promise<FormSubmissionStatsResponse> => {
    const response = await apiClient.get('/form-submissions/admin/statistics');
    return response.data;
  },

  // Update form submission status
  updateStatus: async (id: string, statusData: StatusUpdateRequest): Promise<ActionResponse> => {
    const response = await apiClient.put(`/form-submissions/admin/${id}/status`, statusData);
    return response.data;
  },

  // Resend auto-response email
  resendEmail: async (id: string): Promise<ActionResponse> => {
    const response = await apiClient.post(`/form-submissions/admin/${id}/resend-email`);
    return response.data;
  },

  // Send custom response email
  sendCustomResponse: async (id: string, responseData: CustomResponseRequest): Promise<ActionResponse> => {
    const response = await apiClient.post(`/form-submissions/admin/${id}/send-response`, responseData);
    return response.data;
  },

  // Delete form submission
  deleteSubmission: async (id: string): Promise<void> => {
    await apiClient.delete(`/form-submissions/admin/${id}`);
  },

  // Check email service connection
  checkEmailService: async (): Promise<EmailServiceCheckResponse> => {
    const response = await apiClient.get('/form-submissions/admin/email-service/check');
    return response.data;
  }
};