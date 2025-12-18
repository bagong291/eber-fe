// src/pages/admin/Certificates.tsx
import { useState, useEffect, ChangeEvent } from 'react';
import { useDebounce } from '@/hooks/use-mobile';
import {
  listCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  uploadCertificateImage,
  Certificate,
  CertificatesListResponse,
} from '@/services/certificates/certificatesApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const Spinner = () => (
  <div
    className="w-6 h-6 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin"
    aria-label="Loading"
  />
);

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certificate | null>(null);
  const [formData, setFormData] = useState<Certificate>({
    name: '',
    image: '',
    status: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: meta.page,
        pageSize: meta.pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const response: CertificatesListResponse = await listCertificates(params);
      setCertificates(response.data);
      setMeta(response.meta);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch certificates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [debouncedSearch, meta.page, meta.pageSize]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', image: '', status: true });
    setImageFile(null);
    setImagePreview('');
    setIsDialogOpen(true);
  };

  const handleEdit = async (item: Certificate) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      image: item.image,
      status: item.status ?? true,
    });
    setImagePreview(item.image);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.image;

      // Upload image if a new file is selected
      if (imageFile) {
        setIsUploading(true);
        try {
          imageUrl = await uploadCertificateImage(imageFile);
        } catch (uploadError) {
          toast({
            title: 'Upload Error',
            description: 'Failed to upload image',
            variant: 'destructive',
          });
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }
        setIsUploading(false);
      }

      const payload: Certificate = {
        name: formData.name || undefined,
        image: imageUrl,
        status: formData.status,
      };

      if (editingItem?.id) {
        await updateCertificate(editingItem.id, payload);
        toast({ title: 'Certificate updated successfully' });
      } else {
        await createCertificate(payload);
        toast({ title: 'Certificate created successfully' });
      }

      setIsDialogOpen(false);
      fetchCertificates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Operation failed',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      try {
        await deleteCertificate(id);
        toast({ title: 'Certificate deleted successfully' });
        fetchCertificates();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete certificate',
          variant: 'destructive',
        });
      }
    }
  };

  const imageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_IMAGE_URL || ''}${path}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Certificates</h1>
        <Button onClick={handleAdd}>Add Certificate</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search certificates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div className="relative aspect-square bg-gray-50">
                  <img
                    src={imageUrl(cert.image)}
                    alt={cert.name || 'Certificate'}
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm ${
                        cert.status
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-400 text-white'
                      }`}
                    >
                      {cert.status ? '●' : '○'}
                    </span>
                  </div>
                </div>
                <div className="p-3 border-t">
                  <h3 className="font-medium text-sm mb-1 truncate" title={cert.name || 'Untitled'}>
                    {cert.name || 'Untitled'}
                  </h3>
                  <p className="text-[11px] text-gray-500 mb-2">
                    {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : '-'}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      onClick={() => handleEdit(cert)}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(cert.id!)}
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Delete"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {certificates.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📜</div>
              <p>No certificates found</p>
            </div>
          )}

          {/* Pagination */}
          {meta.total > meta.pageSize && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <Button
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                disabled={meta.page === 1}
                variant="outline"
                size="sm"
              >
                ← Prev
              </Button>
              <span className="text-sm text-gray-600">
                {meta.page} / {Math.ceil(meta.total / meta.pageSize)}
              </span>
              <Button
                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                disabled={meta.page >= Math.ceil(meta.total / meta.pageSize)}
                variant="outline"
                size="sm"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Certificate' : 'Add Certificate'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">
                Certificate Name <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter certificate name (optional)"
              />
            </div>

            <div>
              <Label htmlFor="image">
                Certificate Image <span className="text-red-500">*</span>
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mb-2"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview.startsWith('data:') ? imagePreview : imageUrl(imagePreview)}
                    alt="Preview"
                    className="max-w-full h-48 object-contain border rounded"
                  />
                </div>
              )}
              {!imagePreview && !editingItem && (
                <p className="text-sm text-gray-500 mt-1">
                  Please upload a certificate image
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status ? 'true' : 'false'}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value === 'true' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? (
                  <>
                    <Spinner /> {isUploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : editingItem ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
