import { useState, useEffect } from 'react';
import { formSubmissionsApi, FormSubmissionFilters } from '@/services/formSubmissionsApi';
import { FormSubmission } from '@/store/dataStore';
import DataTable from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Mail, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  RotateCcw, 
  Filter,
  User,
  Building,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Monitor,
  Loader2
} from 'lucide-react';

// Type for processed form submissions with string IDs
type ProcessedFormSubmission = Omit<FormSubmission, 'id'> & { id: string };

const FormSubmissions = () => {
  const [submissions, setSubmissions] = useState<ProcessedFormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ProcessedFormSubmission | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<FormSubmissionFilters>({
    search: '',
    formType: '',
    status: ''
  });
  
  // Product email specific state
  const [productEmailData, setProductEmailData] = useState<any[]>([]);
  const [emailServiceStatus, setEmailServiceStatus] = useState<any>(null);
  
  // Loading states for email operations
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null);
  const [isSendingCustomResponse, setIsSendingCustomResponse] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [isBulkResending, setIsBulkResending] = useState(false);
  const [lastOperationResult, setLastOperationResult] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Response form state
  const [responseForm, setResponseForm] = useState({
    subject: '',
    message: ''
  });

  // Load submissions
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await formSubmissionsApi.getSubmissions({
        ...filters,
        page: currentPage,
        pageSize
      });
      
      // Ensure we always have an array for submissions
      const submissionsData = response.data?.items || [];
      // Convert numeric IDs to strings to match DataTable expectations
      const processedSubmissions = submissionsData.map(submission => ({
        ...submission,
        id: String(submission.id)
      }));
      setSubmissions(processedSubmissions);
      setTotalCount(response.data?.totalItems || 0);
      setTotalPages(response.data?.totalPages || 0);
    } catch (error) {
      // On error, ensure submissions is an empty array
      setSubmissions([]);
      setTotalCount(0);
      toast({ 
        title: 'Error loading submissions', 
        description: 'Failed to load form submissions. Please try again.',
        variant: 'destructive'
      });
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load email service status
  const loadEmailServiceStatus = async () => {
    try {
      const response = await formSubmissionsApi.checkEmailService();
      setEmailServiceStatus(response.data);
    } catch (error) {
      console.error('Error loading email service status:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadSubmissions();
    loadEmailServiceStatus();
  }, [currentPage, pageSize, filters]);

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle filter changes (reset to first page)
  const handleFiltersChange = (newFilters: Partial<FormSubmissionFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'secondary'; // Green-ish for successful email delivery
      case 'failed': return 'destructive'; // Red for failed email delivery
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewSubmission = (submission: ProcessedFormSubmission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await formSubmissionsApi.updateStatus(id, { status: status as any });
      toast({ title: 'Status updated successfully' });
      loadSubmissions();
    } catch (error) {
      toast({ 
        title: 'Error updating status', 
        description: 'Failed to update submission status.',
        variant: 'destructive'
      });
    }
  };

  const handleResendEmail = async (id: string, showToast: boolean = true) => {
    if (!id) {
      if (showToast) {
        toast({ 
          title: 'Invalid request', 
          description: 'Please provide a valid submission ID.',
          variant: 'destructive'
        });
      }
      return { success: false, error: 'Invalid ID' };
    }

    try {
      setIsResendingEmail(id);
      await formSubmissionsApi.resendEmail(id);
      
      if (showToast) {
        toast({ 
          title: 'Email resent successfully',
          description: 'The email has been resent to the recipient.'
        });
      }
      
      // Update the submission status optimistically
      setSubmissions(prev => prev.map(sub => 
        sub.id === id ? { ...sub, status: 'sent' } : sub
      ));
      
      setLastOperationResult({ type: 'success', message: 'Email resent successfully' });
      return { success: true };
    } catch (error) {
      console.error('Resend email error:', error);
      let errorMessage = 'Failed to resend email.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'You are not authorized to perform this action. Please log in again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Submission not found. It may have been deleted.';
        }
      }
      
      if (showToast) {
        toast({ 
          title: 'Error resending email', 
          description: errorMessage,
          variant: 'destructive'
        });
      }
      
      setLastOperationResult({ type: 'error', message: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setIsResendingEmail(null);
    }
  };

  const handleSendCustomResponse = async () => {
    if (!selectedSubmission) {
      toast({ 
        title: 'Error', 
        description: 'No submission selected.',
        variant: 'destructive'
      });
      return;
    }

    if (!responseForm.subject?.trim() || !responseForm.message?.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in both subject and message fields.',
        variant: 'destructive'
      });
      return;
    }

    if (responseForm.subject.length > 200) {
      toast({ 
        title: 'Validation Error', 
        description: 'Subject must be less than 200 characters.',
        variant: 'destructive'
      });
      return;
    }

    if (responseForm.message.length > 5000) {
      toast({ 
        title: 'Validation Error', 
        description: 'Message must be less than 5000 characters.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSendingCustomResponse(true);
      await formSubmissionsApi.sendCustomResponse(selectedSubmission.id, responseForm);
      toast({ title: 'Custom response sent successfully' });
      setResponseDialogOpen(false);
      setResponseForm({ subject: '', message: '' });
      loadSubmissions();
    } catch (error) {
      console.error('Send custom response error:', error);
      let errorMessage = 'Failed to send custom response.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'You are not authorized to perform this action. Please log in again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Submission not found. It may have been deleted.';
        }
      }
      
      toast({ 
        title: 'Error sending response', 
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSendingCustomResponse(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      await formSubmissionsApi.deleteSubmission(id);
      toast({ title: 'Submission deleted successfully' });
      loadSubmissions();
    } catch (error) {
      toast({ 
        title: 'Error deleting submission', 
        description: 'Failed to delete submission.',
        variant: 'destructive'
      });
    }
  };

  // Bulk operations
  const handleBulkResend = async () => {
    if (selectedSubmissions.size === 0) {
      toast({
        title: 'No submissions selected',
        description: 'Please select submissions to resend emails.',
        variant: 'destructive'
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to resend emails for ${selectedSubmissions.size} submission(s)?`
    );
    
    if (!confirmed) return;

    try {
      setIsBulkResending(true);
      const results = [];
      
      for (const id of selectedSubmissions) {
        const result = await handleResendEmail(id, false);
        results.push({ id, ...result });
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      toast({
        title: 'Bulk resend completed',
        description: `${successful} email(s) resent successfully${failed > 0 ? `, ${failed} failed` : ''}.`
      });
      
      setSelectedSubmissions(new Set());
      loadSubmissions();
    } catch (error) {
      toast({
        title: 'Bulk resend failed',
        description: 'An error occurred during bulk resend operation.',
        variant: 'destructive'
      });
    } finally {
      setIsBulkResending(false);
    }
  };

  const handleSelectSubmission = (id: string, selected: boolean) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedSubmissions(new Set(submissions.map(s => s.id)));
    } else {
      setSelectedSubmissions(new Set());
    }
  };

  const openResponseDialog = (submission: ProcessedFormSubmission) => {
    setSelectedSubmission(submission);
    setResponseForm({
      subject: `Re: Your inquiry - ${submission.company || submission.fullName || submission.firstName + ' ' + submission.lastName}`,
      message: `Dear ${submission.fullName || submission.firstName},\n\nThank you for your interest in our products and services.\n\nBest regards,\nThe Team`
    });
    setResponseDialogOpen(true);
  };

  const columns = [
    {
      key: 'select' as any,
      label: 'Select',
      render: (value: any, item: ProcessedFormSubmission) => (
        <input
          type="checkbox"
          checked={selectedSubmissions.has(item.id)}
          onChange={(e) => handleSelectSubmission(item.id, e.target.checked)}
          className="rounded border-gray-300"
        />
      )
    },
    {
      key: 'fullName' as keyof ProcessedFormSubmission,
      label: 'Name',
      render: (value: any, item: ProcessedFormSubmission) => {
        return item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A';
      }
    },
    { key: 'email' as keyof ProcessedFormSubmission, label: 'Email' },
    { key: 'phone' as keyof ProcessedFormSubmission, label: 'Phone' },
    { key: 'company' as keyof ProcessedFormSubmission, label: 'Company' },
    { key: 'formType' as keyof ProcessedFormSubmission, label: 'Form Type' },
    {
      key: 'productCode' as keyof ProcessedFormSubmission,
      label: 'Product Code',
      render: (value: any, item: ProcessedFormSubmission) => {
        // Check if this is a product email submission and extract product code from message
        if (item.formType === 'product_email' || (item.message && item.message.includes('product_code'))) {
          try {
            // Try to extract product code from message or use the field if available
            return value || 'N/A';
          } catch {
            return 'N/A';
          }
        }
        return value || '-';
      }
    },
    {
      key: 'status' as keyof ProcessedFormSubmission,
      label: 'Status',
      render: (value: string) => {
        const statusLabels = {
          'sent': 'Email Sent',
          'failed': 'Failed to Send'
        };
        return (
          <Badge variant={getStatusBadgeVariant(value)}>
            {statusLabels[value as keyof typeof statusLabels] || value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );
      }
    },
    {
      key: 'createdAt' as keyof ProcessedFormSubmission,
      label: 'Submitted',
      render: (value: string) => formatDate(value)
    }
  ];

  const handleAdd = () => {
    // For form submissions, we don't typically add manually
    // but we can implement if needed
    toast({ 
      title: 'Info', 
      description: 'Form submissions are created automatically when users submit forms.',
    });
  };

  const handleEdit = (submission: ProcessedFormSubmission) => {
    // For form submissions, "edit" means viewing the details
    handleViewSubmission(submission);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Form Submissions</h1>
          {lastOperationResult && (
            <div className={`text-sm mt-1 ${
              lastOperationResult.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {lastOperationResult.message}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {selectedSubmissions.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedSubmissions.size} selected
              </span>
              <Button
                onClick={handleBulkResend}
                disabled={isBulkResending}
                size="sm"
                className="flex items-center gap-2"
              >
                {isBulkResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {isBulkResending ? 'Resending...' : 'Bulk Resend'}
              </Button>
            </div>
          )}
          {emailServiceStatus && (
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${
                emailServiceStatus.emailServiceConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                Email Service: {emailServiceStatus.emailServiceConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, email..."
              value={filters.search || ''}
              onChange={(e) => handleFiltersChange({ search: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="formType">Is Form Type</Label>
            <Select
              value={filters.formType || 'all'}
              onValueChange={(value) => handleFiltersChange({ formType: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select form type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Form Types</SelectItem>
                <SelectItem value="instant_access">Instant Access</SelectItem>
                <SelectItem value="contact">Contact Form</SelectItem>
                <SelectItem value="product_email">Product Email</SelectItem>
                <SelectItem value="inquiry">General Inquiry</SelectItem>
                <SelectItem value="quote_request">Quote Request</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFiltersChange({ status: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="sent">Email Sent</SelectItem>
                <SelectItem value="failed">Failed to Send</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={() => {
                setFilters({ search: '', formType: '', status: '' });
                setCurrentPage(1);
              }}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <DataTable
          data={submissions}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDeleteSubmission}
          title="Form Submissions"
          searchPlaceholder="Search submissions..."
          searchValue={filters.search}
          onSearchChange={(value) => handleFiltersChange({ search: value })}
          useServerSidePagination={true}
          isLoading={loading}
          pagination={{
            currentPage,
            totalPages,
            pageSize,
            totalItems: totalCount,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange
          }}
        />
      )}

      {/* View Submission Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              View Submission Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <Badge variant={getStatusBadgeVariant(selectedSubmission.status)}>
                  {selectedSubmission.status === 'sent' ? 'Email Sent' : 'Failed to Send'}
                </Badge>
                <div className="flex gap-2">
                  <Select
                    value={selectedSubmission.status}
                    onValueChange={(value) => handleUpdateStatus(selectedSubmission.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sent">Email Sent</SelectItem>
                      <SelectItem value="failed">Failed to Send</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Name</Label>
                    <p>{selectedSubmission.fullName || `${selectedSubmission.firstName || ''} ${selectedSubmission.lastName || ''}`.trim() || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Email</Label>
                    <p>{selectedSubmission.email}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Phone</Label>
                    <p>{selectedSubmission.phone}</p>
                  </div>
                  {selectedSubmission.company && (
                    <div>
                      <Label className="font-semibold">Company</Label>
                      <p>{selectedSubmission.company}</p>
                    </div>
                  )}
                  {selectedSubmission.city && (
                    <div>
                      <Label className="font-semibold">City</Label>
                      <p>{selectedSubmission.city}</p>
                    </div>
                  )}
                  {/* Product Email Specific Information */}
                  {selectedSubmission.formType === 'product_email' && (
                    <>
                      <div className="col-span-2">
                        <Label className="font-semibold">Product Information</Label>
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm">
                            <strong>Type:</strong> Product Email Request<br/>
                            <strong>Email Template:</strong> Professional product information email
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Message */}
              {selectedSubmission.message && (
                <Card>
                  <CardHeader>
                    <CardTitle>Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
                  </CardContent>
                </Card>
              )}

              {/* Technical Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Technical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Form Type</Label>
                    <p>{selectedSubmission.formType}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Submitted</Label>
                    <p>{formatDate(selectedSubmission.createdAt)}</p>
                  </div>
                  {selectedSubmission.updatedAt !== selectedSubmission.createdAt && (
                    <div>
                      <Label className="font-semibold">Last Updated</Label>
                      <p>{formatDate(selectedSubmission.updatedAt)}</p>
                    </div>
                  )}
                  {selectedSubmission.ipAddress && (
                    <div>
                      <Label className="font-semibold">IP Address</Label>
                      <p>{selectedSubmission.ipAddress}</p>
                    </div>
                  )}
                  {selectedSubmission.userAgent && (
                    <div className="col-span-2">
                      <Label className="font-semibold">User Agent</Label>
                      <p className="text-sm text-gray-600 break-all">{selectedSubmission.userAgent}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleResendEmail(selectedSubmission.id)}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isResendingEmail === selectedSubmission.id}
                >
                  {isResendingEmail === selectedSubmission.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">Resending...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Resend Email
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => openResponseDialog(selectedSubmission)}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Custom Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Custom Response
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="subject">Subject</Label>
                <span className={`text-xs ${responseForm.subject.length > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {responseForm.subject.length}/200
                </span>
              </div>
              <Input
                id="subject"
                value={responseForm.subject}
                onChange={(e) => setResponseForm({ ...responseForm, subject: e.target.value })}
                placeholder="Email subject"
                maxLength={250} // Allow a bit over to show validation error
                className={responseForm.subject.length > 200 ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="message">Message</Label>
                <span className={`text-xs ${responseForm.message.length > 5000 ? 'text-red-500' : 'text-gray-500'}`}>
                  {responseForm.message.length}/5000
                </span>
              </div>
              <Textarea
                id="message"
                value={responseForm.message}
                onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                placeholder="Email message"
                rows={8}
                maxLength={5100} // Allow a bit over to show validation error
                className={responseForm.message.length > 5000 ? 'border-red-500' : ''}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setResponseDialogOpen(false)}
                disabled={isSendingCustomResponse}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendCustomResponse}
                disabled={isSendingCustomResponse}
                className="flex items-center gap-2"
              >
                {isSendingCustomResponse ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSendingCustomResponse ? 'Sending...' : 'Send Response'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormSubmissions;