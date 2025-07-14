import { useEffect, useState } from 'react';
import {
  listAdminCompanyProfiles,
  getAdminCompanyProfile,
  createAdminCompanyProfile,
  updateAdminCompanyProfile,
  deleteAdminCompanyProfile,
  uploadCompanyProfileImage, // <-- add import
  AdminCompanyProfileEntity,
  AdminCompanyProfileListResponse,
  AdminCompanyProfileImage, // <-- add import
  AdminCompanyProfileDataBox // <-- add import
} from '@/services/adminCompanyProfileApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-mobile';

export default function AdminCompanyProfiles() {
  const [companies, setCompanies] = useState<AdminCompanyProfileEntity[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyProfileEntity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminCompanyProfileEntity | null>(null);
  const [formData, setFormData] = useState<AdminCompanyProfileEntity>({
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
    fetchCompanies();
  }, [debouncedSearch, meta.page, meta.pageSize]);

  useEffect(() => {
    if (selectedId !== null) {
      fetchCompany(selectedId);
    } else {
      setSelectedCompany(null);
    }
  }, [selectedId]);

  async function fetchCompanies() {
    setIsLoading(true);
    try {
      const res = await listAdminCompanyProfiles({ search: debouncedSearch, page: meta.page, pageSize: meta.pageSize });
      setCompanies(res.data);
      setMeta(res.meta);
      if (res.data.length > 0 && selectedId === null) {
        setSelectedId(res.data[0].id!);
      }
    } catch (e) {
      toast({ title: 'Failed to fetch companies', variant: 'destructive' });
    }
    setIsLoading(false);
  }

  async function fetchCompany(id: number) {
    setIsLoading(true);
    try {
      const data = await getAdminCompanyProfile(id);
      setSelectedCompany(data);
    } catch (e) {
      toast({ title: 'Failed to fetch company', variant: 'destructive' });
    }
    setIsLoading(false);
  }

  function openAddDialog() {
    setEditingItem(null);
    setFormData({ name: '', location: '', coordinate: '', address: '', description: '', data: {} });
    setIsDialogOpen(true);
  }

  async function openEditDialog(item: AdminCompanyProfileEntity) {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  }

  async function handleDelete(item: AdminCompanyProfileEntity) {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    setIsSubmitting(true);
    try {
      await deleteAdminCompanyProfile(item.id!);
      toast({ title: 'Deleted successfully' });
      fetchCompanies();
      setSelectedId(null);
    } catch (e) {
      toast({ title: 'Failed to delete company', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  async function handleDuplicate(item: AdminCompanyProfileEntity) {
    setIsSubmitting(true);
    try {
      // Deep copy the item, remove id, createdAt, updatedAt, and make all unique fields unique
      const { id, createdAt, updatedAt, ...rest } = item;
      const randomSuffix = Math.floor(Math.random() * 10000);
      const newItem: AdminCompanyProfileEntity = {
        ...rest,
        name: `(Copy) ${item.name} ${randomSuffix}`,
        location: `${item.location} ${randomSuffix}`,
        coordinate: `${item.coordinate} ${randomSuffix}`,
        address: `${item.address} ${randomSuffix}`,
        description: `${item.description} ${randomSuffix}`,
      };
      await createAdminCompanyProfile(newItem);
      toast({ title: 'Company duplicated' });
      fetchCompanies();
    } catch (e) {
      toast({ title: 'Failed to duplicate company', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let updatedId: number | undefined = undefined;
      if (editingItem) {
        await updateAdminCompanyProfile(editingItem.id!, formData);
        updatedId = editingItem.id!;
        toast({ title: 'Company updated' });
      } else {
        const created = await createAdminCompanyProfile(formData);
        updatedId = created.id;
        toast({ title: 'Company created' });
      }
      setIsDialogOpen(false);
      fetchCompanies();
      // If the updated/created company is the currently selected one, re-fetch its latest data
      if (updatedId && selectedId === updatedId) {
        fetchCompany(updatedId);
      }
    } catch (e) {
      toast({ title: 'Failed to save company', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  // Add these helper components at the top of the file
  function InfoBoxGrid({ box }: { box: AdminCompanyProfileDataBox }) {
    if (!box || !Array.isArray(box.data)) return null;
    return (
      <div className={`grid grid-cols-${box.column || 2} gap-4 mb-4`}>
        {box.data.map((item, idx) => (
          <div key={idx} className="bg-gray-50 rounded p-3 shadow-sm">
            <div className="font-semibold text-sm mb-1">{item.name}</div>
            <div className="text-sm whitespace-pre-line">{item.data}</div>
          </div>
        ))}
      </div>
    );
  }

  function ImageGrid({ images }: { images: AdminCompanyProfileImage[] }) {
    if (!images || !Array.isArray(images)) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {images.map((img, idx) => {
          let src = img.url;
          if (src && !src.startsWith('http')) {
            src = `${import.meta.env.VITE_IMAGE_URL || ''}${src}`;
          }
          return (
            <div key={idx} className="flex flex-col items-center">
              <img src={src} alt={img.title} className="w-28 h-28 object-cover rounded shadow" />
              <div className="text-xs text-center mt-2">{img.title}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // Add these helper components for dynamic form fields
  function BoxEditor({ label, value, onChange }: { label: string; value: AdminCompanyProfileDataBox; onChange: (v: AdminCompanyProfileDataBox) => void }) {
    const handleColumnChange = (col: number) => {
      onChange({ ...value, column: col });
    };
    const handleItemChange = (idx: number, field: 'name' | 'data', val: string) => {
      const newData = (value.data as { name: string; data: string }[]).map((item, i) => i === idx ? { ...item, [field]: val } : item);
      onChange({ ...value, data: newData });
    };
    const addItem = () => {
      onChange({ ...value, data: [...(value.data || []), { name: '', data: '' }] });
    };
    const removeItem = (idx: number) => {
      onChange({ ...value, data: (value.data as { name: string; data: string }[]).filter((_, i) => i !== idx) });
    };
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded shadow-sm">
        <div className="font-semibold mb-2">{label}</div>
        <div className="flex items-center mb-2">
          <Label className="mr-2">Columns:</Label>
          <Input type="number" min={1} max={4} value={value.column || 2} onChange={e => handleColumnChange(Number(e.target.value))} className="w-20" />
        </div>
        {(value.data || []).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input placeholder="Name" value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} className="w-40" />
            <Input placeholder="Data" value={item.data} onChange={e => handleItemChange(idx, 'data', e.target.value)} className="flex-1" />
            <Button type="button" size="sm" variant="destructive" onClick={() => removeItem(idx)}>Remove</Button>
          </div>
        ))}
        <Button type="button" size="sm" onClick={addItem}>Add Row</Button>
      </div>
    );
  }

  function ImageListEditor({ label, value, onChange }: { label: string; value: AdminCompanyProfileImage[]; onChange: (v: AdminCompanyProfileImage[]) => void }) {
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const handleItemChange = (idx: number, field: keyof AdminCompanyProfileImage, val: string) => {
      const newData = value.map((item, i) => i === idx ? { ...item, [field]: val } : item);
      onChange(newData);
    };
    const addItem = () => {
      onChange([...(value || []), { url: '', title: '' }]);
    };
    const removeItem = (idx: number) => {
      // Preserve scroll position
      const dialog = document.querySelector('.DialogContent') as HTMLElement | null;
      const scrollTop = dialog ? dialog.scrollTop : 0;
      onChange(value.filter((_, i) => i !== idx));
      // Restore scroll position after state update
      setTimeout(() => {
        if (dialog) dialog.scrollTop = scrollTop;
      }, 0);
    };
    const handleFileChange = async (idx: number, file: File) => {
      setUploadingIdx(idx);
      try {
        const url = await uploadCompanyProfileImage(file);
        const newData = value.map((item, i) => i === idx ? { ...item, url } : item);
        onChange(newData);
        toast({ title: 'Image uploaded' });
      } catch (e) {
        toast({ title: 'Failed to upload image', variant: 'destructive' });
      }
      setUploadingIdx(null);
    };
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded shadow-sm">
        <div className="font-semibold mb-2">{label}</div>
        {(value || []).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <div className="flex flex-col gap-1">
              <Input placeholder="Image URL" value={item.url} onChange={e => handleItemChange(idx, 'url', e.target.value)} className="w-64" />
              <div className="flex items-center gap-2 mt-1">
                <Input type="file" accept="image/*" onChange={e => {
                  if (e.target.files && e.target.files[0]) handleFileChange(idx, e.target.files[0]);
                }} className="w-48" />
                {uploadingIdx === idx && <span className="text-xs text-blue-600 animate-pulse">Uploading...</span>}
                {item.url && <img src={import.meta.env.VITE_IMAGE_URL+item.url} alt="Preview" className="w-12 h-12 object-cover rounded border ml-2" />}
              </div>
            </div>
            <Input placeholder="Title" value={item.title} onChange={e => handleItemChange(idx, 'title', e.target.value)} className="w-40" />
            <Button type="button" size="sm" variant="destructive" onClick={() => removeItem(idx)}>Remove</Button>
          </div>
        ))}
        <Button type="button" size="sm" onClick={addItem}>Add Image</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r p-4 flex flex-col">
        <div className="mb-4">
          <Input
            className="w-full"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button className="mb-4" onClick={openAddDialog}>Add New Company</Button>
        <div className="flex-1 overflow-y-auto">
          {companies.map((item) => (
            <div
              key={item.id}
              className={`p-3 mb-2 rounded cursor-pointer ${selectedId === item.id ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'}`}
              onClick={() => setSelectedId(item.id!)}
            >
              {item.name}
            </div>
          ))}
          {isLoading && <div className="text-center py-4">Loading...</div>}
          {!isLoading && companies.length === 0 && <div className="text-center py-4 text-gray-500">No companies found</div>}
        </div>
        {/* Pagination Controls */}
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
      </div>
      {/* Main Area */}
      <div className="flex-1 p-8">
        {selectedCompany ? (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedCompany.name}</h2>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedCompany)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(selectedCompany)}>Duplicate</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedCompany)}>Delete</Button>
              </div>
            </div>
            <div className="mb-2"><span className="font-semibold">Address:</span> {selectedCompany.address}</div>
            <div className="mb-2"><span className="font-semibold">Location:</span> {selectedCompany.location}</div>
            <div className="mb-2"><span className="font-semibold">Coordinate:</span> {selectedCompany.coordinate}</div>
            <div className="mb-2"><span className="font-semibold">Description:</span> {selectedCompany.description}</div>
            {/* --- Info Boxes --- */}
            {selectedCompany.data?.box_1 && (
              <>
                <div className="font-semibold text-lg mt-6 mb-2">Info Box 1</div>
                <InfoBoxGrid box={selectedCompany.data.box_1} />
              </>
            )}
            {selectedCompany.data?.box_2 && (
              <>
                <div className="font-semibold text-lg mt-6 mb-2">Info Box 2</div>
                <InfoBoxGrid box={selectedCompany.data.box_2} />
              </>
            )}
            {/* --- Product Application --- */}
            {selectedCompany.data?.p && (
              <div className="mt-6 mb-2">
                <div className="font-semibold text-lg">Product Application</div>
                <div className="font-bold text-base mt-2">{selectedCompany.data.p.title}</div>
                <div className="text-sm mt-1 mb-2">{selectedCompany.data.p.description}</div>
              </div>
            )}
            {/* --- Rearranged Titles and Images --- */}
            {selectedCompany.data?.title_1 && (
              <div className="font-bold text-base mt-4">{selectedCompany.data.title_1}</div>
            )}
            {selectedCompany.data?.images_1 && (
              <>
                <div className="font-semibold text-lg mt-2 mb-2">Images 1</div>
                <ImageGrid images={selectedCompany.data.images_1} />
              </>
            )}
            {selectedCompany.data?.title_2 && (
              <div className="font-bold text-base mt-4">{selectedCompany.data.title_2}</div>
            )}
            {selectedCompany.data?.images_2 && (
              <>
                <div className="font-semibold text-lg mt-2 mb-2">Images 2</div>
                <ImageGrid images={selectedCompany.data.images_2} />
              </>
            )}
            {selectedCompany.data?.title_3 && (
              <div className="font-bold text-base mt-4">{selectedCompany.data.title_3}</div>
            )}
            {selectedCompany.data?.images_3 && (
              <>
                <div className="font-semibold text-lg mt-2 mb-2">Images 3</div>
                <ImageGrid images={selectedCompany.data.images_3} />
              </>
            )}
            {/* --- Descriptions --- */}
            {selectedCompany.data?.description_1 && (
              <div className="text-sm mt-1 mb-2">{selectedCompany.data.description_1}</div>
            )}
            {selectedCompany.data?.description_2 && (
              <div className="text-sm mt-1 mb-2">{selectedCompany.data.description_2}</div>
            )}
            {selectedCompany.data?.description_3 && (
              <div className="text-sm mt-1 mb-2">{selectedCompany.data.description_3}</div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-20">Select a company to view details</div>
        )}
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
            {/* --- Dynamic Nested Data Sections --- */}
            <BoxEditor label="Info Box 1" value={formData.data.box_1 || { column: 2, data: [] }} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, box_1: v } }))} />
            <BoxEditor label="Info Box 2" value={formData.data.box_2 || { column: 2, data: [] }} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, box_2: v } }))} />
            <div className="mb-4 p-4 bg-gray-50 rounded shadow-sm">
              <div className="font-semibold mb-2">Product Application</div>
              <Input placeholder="Title" value={formData.data.p?.title || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, p: { ...f.data.p, title: e.target.value } } }))} className="mb-2" />
              <Input placeholder="Description" value={formData.data.p?.description || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, p: { ...f.data.p, description: e.target.value } } }))} />
            </div>
            {/* --- Rearranged Title/Image fields --- */}
            <Input placeholder="Title 1" value={formData.data.title_1 || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, title_1: e.target.value } }))} className="mb-2" />
            <ImageListEditor label="Images 1" value={formData.data.images_1 || []} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, images_1: v } }))} />
            <Input placeholder="Title 2" value={formData.data.title_2 || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, title_2: e.target.value } }))} className="mb-2" />
            <ImageListEditor label="Images 2" value={formData.data.images_2 || []} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, images_2: v } }))} />
            <Input placeholder="Title 3" value={formData.data.title_3 || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, title_3: e.target.value } }))} className="mb-2" />
            <ImageListEditor label="Images 3" value={formData.data.images_3 || []} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, images_3: v } }))} />
            {/* --- Descriptions --- */}
            <Input placeholder="Description 1" value={formData.data.description_1 || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, description_1: e.target.value } }))} className="mb-2" />
            <Input placeholder="Description 2" value={formData.data.description_2 || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, description_2: e.target.value } }))} className="mb-2" />
            <Input placeholder="Description 3" value={formData.data.description_3 || ''} onChange={e => setFormData(f => ({ ...f, data: { ...f.data, description_3: e.target.value } }))} />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 