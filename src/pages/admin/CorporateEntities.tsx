
import { useEffect, useState } from 'react';
import {
  listCorporates,
  getCorporate,
  createCorporate,
  updateCorporate,
  deleteCorporate,
  CorporateEntity,
  CorporateListResponse
} from '@/services/corporateApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-mobile';

export default function CorporateEntities() {
  const [corporates, setCorporates] = useState<CorporateEntity[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CorporateEntity | null>(null);
  const [viewingItem, setViewingItem] = useState<CorporateEntity | null>(null);
  const [formData, setFormData] = useState<CorporateEntity>({
    name: '',
    location: '',
    coordinate: '',
    address: '',
    description: '',
    data: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCorporates();
  }, [debouncedSearch, meta.page, meta.pageSize]);

  async function fetchCorporates() {
    setIsLoading(true);
    try {
      const res = await listCorporates({ search: debouncedSearch, page: meta.page, pageSize: meta.pageSize });
      setCorporates(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast({ title: 'Failed to fetch companies', variant: 'destructive' });
    }
    setIsLoading(false);
  }

  function openAddDialog() {
    setEditingItem(null);
    setFormData({ name: '', location: '', coordinate: '', address: '', description: '', data: {} });
    setIsDialogOpen(true);
  }

  async function openEditDialog(item: CorporateEntity) {
    setIsSubmitting(true);
    try {
      const data = await getCorporate(item.id!);
      setEditingItem(data);
      setFormData(data);
      setIsDialogOpen(true);
    } catch (e) {
      toast({ title: 'Failed to fetch company', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  async function openDetailDialog(item: CorporateEntity) {
    setIsSubmitting(true);
    try {
      const data = await getCorporate(item.id!);
      setViewingItem(data);
      setIsDetailOpen(true);
    } catch (e) {
      toast({ title: 'Failed to fetch company', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  async function handleDelete(item: CorporateEntity) {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    setIsSubmitting(true);
    try {
      await deleteCorporate(item.id!);
      toast({ title: 'Deleted successfully' });
      fetchCorporates();
    } catch (e) {
      toast({ title: 'Failed to delete company', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateCorporate(editingItem.id!, formData);
        toast({ title: 'Company updated' });
      } else {
        await createCorporate(formData);
        toast({ title: 'Company created' });
      }
      setIsDialogOpen(false);
      fetchCorporates();
    } catch (e) {
      toast({ title: 'Failed to save company', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  return (
    <div>
      <div className="flex items-center mb-4 space-x-4">
        <Input
          className="max-w-sm"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={openAddDialog}>Add Company</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {corporates.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2">{item.address}</td>
                <td className="px-4 py-2">{item.location}</td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2 space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openDetailDialog(item)}>View</Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && corporates.length === 0 && <div className="text-center py-4 text-gray-500">No companies found</div>}
      </div>
      {/* Pagination Controls - bottom, centered, modern UI */}
      <div className="flex flex-col items-center justify-center mt-6">
        <div className="flex items-center space-x-4 bg-white rounded-lg shadow px-4 py-2">
          <Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => setMeta(m => ({ ...m, page: m.page - 1 }))}>Prev</Button>
          <span className="text-sm font-medium">Page {meta.page} of {Math.ceil(meta.total / meta.pageSize) || 1}</span>
          <Button size="sm" variant="outline" disabled={meta.page >= Math.ceil(meta.total / meta.pageSize)} onClick={() => setMeta(m => ({ ...m, page: m.page + 1 }))}>Next</Button>
          <Label className="ml-2 text-sm">Page Size:</Label>
          <select
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={meta.pageSize}
            onChange={e => setMeta(m => ({ ...m, pageSize: Number(e.target.value) || 10, page: 1 }))}
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Company' : 'Add Company'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={formData.location} onChange={e => setFormData(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <Label>Coordinate</Label>
              <Input value={formData.coordinate} onChange={e => setFormData(f => ({ ...f, coordinate: e.target.value }))} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} required />
            </div>
            {/* TODO: Add UI for editing nested data (formData.data) */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 p-2">
              <div>
                <span className="font-semibold">Name:</span> {viewingItem.name}
              </div>
              <div>
                <span className="font-semibold">Location:</span> {viewingItem.location}
              </div>
              <div>
                <span className="font-semibold">Coordinate:</span> {viewingItem.coordinate}
              </div>
              <div>
                <span className="font-semibold">Address:</span> {viewingItem.address}
              </div>
              <div>
                <span className="font-semibold">Description:</span> {viewingItem.description}
              </div>
              {/* Render nested data (boxes, images, etc.) in a clean layout */}
              <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(viewingItem.data, null, 2)}</pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
