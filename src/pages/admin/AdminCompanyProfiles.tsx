import { useEffect, useState, useMemo, useCallback } from 'react';
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
import MultiLanguageInput from '@/components/MultiLanguageInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-mobile';

// Update the type for AdminCompanyProfileDataBox.data to include id
// If the type is imported, add a local type for use in BoxEditor

type InfoBoxRow = { 
  id: string; 
  name: string; 
  data: string;
  name_en?: string;
  name_id?: string;
  data_en?: string;
  data_id?: string;
};
type InfoBoxDataBox = { column?: number; data: InfoBoxRow[] };

// Helper components moved outside to prevent re-creation on every render
function InfoBoxGrid({ box, viewLanguage }: { box: AdminCompanyProfileDataBox; viewLanguage?: 'en' | 'id' }) {
  if (!box || !Array.isArray(box.data)) return null;
  return (
    <div className={`grid grid-cols-${box.column || 2} gap-4 mb-4`}>
      {box.data.map((item, idx) => {
        // Language-aware name display
        const displayName = viewLanguage === 'en' 
          ? (item.name_en || item.name || '') 
          : viewLanguage === 'id'
          ? (item.name_id || item.name_en || item.name || '')
          : item.name; // fallback for when viewLanguage is not provided
          
        // Language-aware data display
        const displayData = viewLanguage === 'en' 
          ? (item.data_en || item.data || '') 
          : viewLanguage === 'id'
          ? (item.data_id || item.data_en || item.data || '')
          : item.data; // fallback for when viewLanguage is not provided
          
        return (
          <div key={idx} className="bg-gray-50 rounded p-3 shadow-sm">
            <div className="font-semibold text-sm mb-1">{displayName}</div>
            <div className="text-sm whitespace-pre-line">{displayData}</div>
          </div>
        );
      })}
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

function BoxEditor({ label, value, onChange, currentLanguage }: { label: string; value: InfoBoxDataBox; onChange: (v: InfoBoxDataBox) => void; currentLanguage: 'en' | 'id' }) {
  const handleColumnChange = useCallback((col: number) => {
    onChange({ ...value, column: col });
  }, [value, onChange]);

  const handleItemChange = useCallback((uid: string, field: 'name' | 'data', val: string) => {
    const newData = (value.data as InfoBoxRow[]).map((item) => {
      if (item.id === uid) {
        if (field === 'name') {
          return { 
            ...item, 
            [`name_${currentLanguage}`]: val,
            name: val // Always update the legacy field with current value regardless of language
          };
        } else {
          return { 
            ...item, 
            [`data_${currentLanguage}`]: val,
            data: val // Always update the legacy field with current value regardless of language
          };
        }
      }
      return item;
    });
    onChange({ ...value, data: newData });
  }, [value, onChange, currentLanguage]);

  const addItem = useCallback(() => {
    onChange({ 
      ...value, 
      data: [...(value.data || []), { 
        id: crypto.randomUUID(), 
        name: '', name_en: '', name_id: '',
        data: '', data_en: '', data_id: ''
      }] 
    });
  }, [value, onChange]);

  const removeItem = useCallback((uid: string) => {
    onChange({ 
      ...value, 
      data: (value.data as InfoBoxRow[]).filter((item) => item.id !== uid) 
    });
  }, [value, onChange]);
  
  return (
    <div className="space-y-6">
      {/* Header Section with better visual hierarchy */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-6 bg-blue-500 rounded-sm"></div>
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <span className="text-sm text-gray-500">({(value.data || []).length} items)</span>
        </div>
        
        {/* Column Configuration */}
        <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg">
          <Label className="text-sm font-medium text-gray-700">Grid Layout:</Label>
          <select
            value={value.column || 2}
            onChange={e => handleColumnChange(Number(e.target.value))}
            className="text-sm border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
          </select>
        </div>
      </div>

      {/* Info Box Items */}
      <div className="space-y-4">
        {(value.data || []).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">No items yet. Add your first info box item to get started.</p>
            <Button type="button" variant="outline" onClick={addItem}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Item
            </Button>
          </div>
        ) : (
          (value.data || []).map((item, index) => (
            <div key={item.id} className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
              {/* Item Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Info Box Item</span>
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>

              {/* Content Fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                    Title
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                      </svg>
                      {currentLanguage === 'en' ? 'EN' : 'ID'}
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={currentLanguage === 'en' 
                        ? (item.name_en || item.name || '') 
                        : (item.name_id || item.name_en || item.name || '')
                      }
                      onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder={currentLanguage === 'en' ? "Enter title in English (e.g., Our Vision)" : "Masukkan judul dalam Bahasa Indonesia (contoh: Visi Kami)"}
                      className="w-full pr-12 border-l-4 border-l-blue-400"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600">
                      {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                    Description
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                      </svg>
                      {currentLanguage === 'en' ? 'EN' : 'ID'}
                    </span>
                  </Label>
                  <div className="relative">
                    <textarea
                      value={currentLanguage === 'en' 
                        ? (item.data_en || item.data || '') 
                        : (item.data_id || item.data_en || item.data || '')
                      }
                      onChange={e => handleItemChange(item.id, 'data', e.target.value)}
                      placeholder={currentLanguage === 'en' ? "Enter detailed description in English..." : "Masukkan deskripsi detail dalam Bahasa Indonesia..."}
                      className="w-full min-h-[100px] px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical border-l-4 border-l-blue-400"
                      rows={3}
                    />
                    <div className="absolute right-3 top-3 text-xs font-medium text-blue-600">
                      {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Item Button */}
      {(value.data || []).length > 0 && (
        <div className="flex justify-center pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={addItem}
            className="border-dashed border-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Another Item
          </Button>
        </div>
      )}
    </div>
  );
}

function ImageListEditor({ label, value, onChange }: { label: string; value: AdminCompanyProfileImage[]; onChange: (v: AdminCompanyProfileImage[]) => void }) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const handleTitleChange = (idx: number, val: string) => {
    const newData = value.map((item, i) => i === idx ? { ...item, title: val } : item);
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
  const deleteImage = (idx: number) => {
    const newData = value.map((item, i) => i === idx ? { ...item, url: '' } : item);
    onChange(newData);
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
            {item.url ? (
              // Show image and delete button when image exists
              <div className="flex items-center gap-2">
                <img src={import.meta.env.VITE_IMAGE_URL+item.url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                <Button type="button" size="sm" variant="outline" onClick={() => deleteImage(idx)}>Delete Image</Button>
              </div>
            ) : (
              // Show upload button when no image
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={e => {
                  if (e.target.files && e.target.files[0]) handleFileChange(idx, e.target.files[0]);
                }} className="w-48" />
                {uploadingIdx === idx && <span className="text-xs text-blue-600 animate-pulse">Uploading...</span>}
              </div>
            )}
          </div>
          <Input placeholder="Title" value={item.title} onChange={e => handleTitleChange(idx, e.target.value)} className="w-40" />
          <Button type="button" size="sm" variant="destructive" onClick={() => removeItem(idx)}>Remove</Button>
        </div>
      ))}
      <Button type="button" size="sm" onClick={addItem}>Add Image</Button>
    </div>
  );
}

// Helper to add id to box data rows if missing, but keep the type as AdminCompanyProfileDataBox
function migrateBoxRows(box: AdminCompanyProfileDataBox | undefined): AdminCompanyProfileDataBox & { data: { name: string; data: string; id: string }[] } {
  return {
    column: box?.column ?? 2,
    data: ((box?.data || []).map((item: { name: string; data: string; id?: string }) =>
      item.id ? item : { ...item, id: crypto.randomUUID() }
    )) as { name: string; data: string; id: string }[],
  };
}

export default function AdminCompanyProfiles() {
  const [companies, setCompanies] = useState<AdminCompanyProfileEntity[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyProfileEntity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminCompanyProfileEntity | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'id'>('en'); // Global language state for form
  const [viewLanguage, setViewLanguage] = useState<'en' | 'id'>('en'); // Language state for view page
  const [formData, setFormData] = useState<AdminCompanyProfileEntity>({
    name: '',
    location: '',
    coordinate: '',
    address: '',
    address_en: '',
    address_id: '',
    description: '',
    data: {
      box_1: { column: 2, data: [] },
      box_2: { column: 2, data: [] },
    },
    main_image: '', // <-- add default
    status: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Store migrated box data separately to prevent re-migration on every render
  const [migratedBox1, setMigratedBox1] = useState<InfoBoxDataBox & { data: InfoBoxRow[] }>(() => 
    migrateBoxRows(formData.data.box_1)
  );
  const [migratedBox2, setMigratedBox2] = useState<InfoBoxDataBox & { data: InfoBoxRow[] }>(() => 
    migrateBoxRows(formData.data.box_2)
  );

  // Create stable onChange handlers that update both migrated state and formData
  const handleBox1Change = useCallback((v: InfoBoxDataBox & { data: InfoBoxRow[] }) => {
    // Update migrated state for immediate UI response
    setMigratedBox1(v);
    // Update formData for persistence
    setFormData(f => ({ 
      ...f, 
      data: { 
        ...f.data, 
        box_1: { 
          column: v.column, 
          data: v.data.map(({ id, ...rest }) => rest) 
        } 
      } 
    }));
  }, []);

  const handleBox2Change = useCallback((v: InfoBoxDataBox & { data: InfoBoxRow[] }) => {
    // Update migrated state for immediate UI response
    setMigratedBox2(v);
    // Update formData for persistence
    setFormData(f => ({ 
      ...f, 
      data: { 
        ...f.data, 
        box_2: { 
          column: v.column, 
          data: v.data.map(({ id, ...rest }) => rest) 
        } 
      } 
    }));
  }, []);

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
    const newFormData = {
      name: '',
      location: '',
      coordinate: '',
      address: '',
      address_en: '',
      address_id: '',
      description: '',
      data: {
        box_1: { column: 2, data: [] },
        box_2: { column: 2, data: [] },
      },
      main_image: '',
      status: true
    };
    setFormData(newFormData);
    // Reset migrated box states
    setMigratedBox1(migrateBoxRows(newFormData.data.box_1));
    setMigratedBox2(migrateBoxRows(newFormData.data.box_2));
    setIsDialogOpen(true);
  }

  async function openEditDialog(item: AdminCompanyProfileEntity) {
    setEditingItem(item);
    setFormData(item);
    // Initialize migrated box states with current data
    setMigratedBox1(migrateBoxRows(item.data.box_1));
    setMigratedBox2(migrateBoxRows(item.data.box_2));
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
        address_en: `${item.address_en || ''} ${randomSuffix}`,
        address_id: `${item.address_id || ''} ${randomSuffix}`,
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
            {/* Main Image Display */}
            {selectedCompany.main_image && (
              <div className="flex justify-center mb-6">
                <img
                  src={selectedCompany.main_image.startsWith('http') ? selectedCompany.main_image : (import.meta.env.VITE_IMAGE_URL + selectedCompany.main_image)}
                  alt="Main"
                  className="w-64 h-64 object-cover rounded shadow border"
                />
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedCompany.name}</h2>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedCompany)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(selectedCompany)}>Duplicate</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedCompany)}>Delete</Button>
              </div>
            </div>
            
            {/* Language Toggle Tabs for View */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setViewLanguage('en')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                    viewLanguage === 'en'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  type="button"
                  onClick={() => setViewLanguage('id')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                    viewLanguage === 'id'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🇮🇩 Indonesia
                </button>
              </div>
            </div>
            <div className="mb-2"><span className="font-semibold">Address:</span> {
              viewLanguage === 'en' 
                ? (selectedCompany.address_en || selectedCompany.address || '') 
                : (selectedCompany.address_id || selectedCompany.address_en || selectedCompany.address || '')
            }</div>
            <div className="mb-2"><span className="font-semibold">Location:</span> {selectedCompany.location}</div>
            <div className="mb-2"><span className="font-semibold">Coordinate:</span> {selectedCompany.coordinate}</div>
            <div className="mb-2">
              <span className="font-semibold">Description:</span> {
                viewLanguage === 'en' 
                  ? (selectedCompany.description_en || selectedCompany.description || '') 
                  : (selectedCompany.description_id || selectedCompany.description_en || selectedCompany.description || '')
              }
            </div>
            <div className="mb-2">
              <span className="font-semibold">Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                selectedCompany.status 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedCompany.status ? 'Active' : 'Inactive'}
              </span>
            </div>
            {/* --- Info Boxes --- */}
            {selectedCompany.data?.box_1 && (
              <>
                <div className="font-semibold text-lg mt-6 mb-2">Info Box 1</div>
                <InfoBoxGrid box={selectedCompany.data.box_1} viewLanguage={viewLanguage} />
              </>
            )}
            {selectedCompany.data?.box_2 && (
              <>
                <div className="font-semibold text-lg mt-6 mb-2">Info Box 2</div>
                <InfoBoxGrid box={selectedCompany.data.box_2} viewLanguage={viewLanguage} />
              </>
            )}
            {/* --- Product Application --- */}
            {selectedCompany.data?.p && (
              <div className="mt-6 mb-2">
                <div className="font-semibold text-lg">Product Application</div>
                <div className="font-bold text-base mt-2">{
                  viewLanguage === 'en' 
                    ? (selectedCompany.data.p.title_en || selectedCompany.data.p.title || '') 
                    : (selectedCompany.data.p.title_id || selectedCompany.data.p.title_en || selectedCompany.data.p.title || '')
                }</div>
                <div className="text-sm mt-1 mb-2">{
                  viewLanguage === 'en' 
                    ? (selectedCompany.data.p.description_en || selectedCompany.data.p.description || '') 
                    : (selectedCompany.data.p.description_id || selectedCompany.data.p.description_en || selectedCompany.data.p.description || '')
                }</div>
              </div>
            )}
            {/* --- Rearranged Titles and Images --- */}
            {(selectedCompany.data?.title_1_en || selectedCompany.data?.title_1_id || selectedCompany.data?.title_1) && (
              <div className="font-bold text-base mt-4">{
                viewLanguage === 'en' 
                  ? (selectedCompany.data?.title_1_en || selectedCompany.data?.title_1 || '') 
                  : (selectedCompany.data?.title_1_id || selectedCompany.data?.title_1_en || selectedCompany.data?.title_1 || '')
              }</div>
            )}
            {selectedCompany.data?.images_1 && (
              <>
                <div className="font-semibold text-lg mt-2 mb-2">Images 1</div>
                <ImageGrid images={selectedCompany.data.images_1} />
              </>
            )}
            {(selectedCompany.data?.title_2_en || selectedCompany.data?.title_2_id || selectedCompany.data?.title_2) && (
              <div className="font-bold text-base mt-4">{
                viewLanguage === 'en' 
                  ? (selectedCompany.data?.title_2_en || selectedCompany.data?.title_2 || '') 
                  : (selectedCompany.data?.title_2_id || selectedCompany.data?.title_2_en || selectedCompany.data?.title_2 || '')
              }</div>
            )}
            {selectedCompany.data?.images_2 && (
              <>
                <div className="font-semibold text-lg mt-2 mb-2">Images 2</div>
                <ImageGrid images={selectedCompany.data.images_2} />
              </>
            )}
            {(selectedCompany.data?.title_3_en || selectedCompany.data?.title_3_id || selectedCompany.data?.title_3) && (
              <div className="font-bold text-base mt-4">{
                viewLanguage === 'en' 
                  ? (selectedCompany.data?.title_3_en || selectedCompany.data?.title_3 || '') 
                  : (selectedCompany.data?.title_3_id || selectedCompany.data?.title_3_en || selectedCompany.data?.title_3 || '')
              }</div>
            )}
            {selectedCompany.data?.images_3 && (
              <>
                <div className="font-semibold text-lg mt-2 mb-2">Images 3</div>
                <ImageGrid images={selectedCompany.data.images_3} />
              </>
            )}
            {/* --- Descriptions --- */}
            {(selectedCompany.data?.description_1_en || selectedCompany.data?.description_1_id || selectedCompany.data?.description_1) && (
              <div className="text-sm mt-1 mb-2">{
                viewLanguage === 'en' 
                  ? (selectedCompany.data?.description_1_en || selectedCompany.data?.description_1 || '') 
                  : (selectedCompany.data?.description_1_id || selectedCompany.data?.description_1_en || selectedCompany.data?.description_1 || '')
              }</div>
            )}
            {(selectedCompany.data?.description_2_en || selectedCompany.data?.description_2_id || selectedCompany.data?.description_2) && (
              <div className="text-sm mt-1 mb-2">{
                viewLanguage === 'en' 
                  ? (selectedCompany.data?.description_2_en || selectedCompany.data?.description_2 || '') 
                  : (selectedCompany.data?.description_2_id || selectedCompany.data?.description_2_en || selectedCompany.data?.description_2 || '')
              }</div>
            )}
            {(selectedCompany.data?.description_3_en || selectedCompany.data?.description_3_id || selectedCompany.data?.description_3) && (
              <div className="text-sm mt-1 mb-2">{
                viewLanguage === 'en' 
                  ? (selectedCompany.data?.description_3_en || selectedCompany.data?.description_3 || '') 
                  : (selectedCompany.data?.description_3_id || selectedCompany.data?.description_3_en || selectedCompany.data?.description_3 || '')
              }</div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-20">Select a company to view details</div>
        )}
      </div>
      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="sticky top-0 z-10 bg-white pt-6 pb-4 border-b -mx-6 px-6">
            <div className="flex items-center justify-between">
              <DialogTitle>{editingItem ? 'Edit Company' : 'Add Company'}</DialogTitle>
              
              {/* Global Language Toggle - Sticky positioned */}
              <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setCurrentLanguage('en')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentLanguage === 'en'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLanguage('id')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentLanguage === 'id'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🇮🇩 Indonesia
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <form onSubmit={handleSubmit} className="space-y-4 py-6">
            {/* Main Image Upload */}
            <div>
              <Label>Main Image</Label>
              <div className="flex items-center gap-4">
                {formData.main_image ? (
                  // Show image and delete button when image exists
                  <div className="flex items-center gap-4">
                    <img
                      src={formData.main_image.startsWith('http') ? formData.main_image : (import.meta.env.VITE_IMAGE_URL + formData.main_image)}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setFormData(f => ({ ...f, main_image: '' }))}
                    >
                      Delete Image
                    </Button>
                  </div>
                ) : (
                  // Show upload button when no image
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async e => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const url = await uploadCompanyProfileImage(e.target.files[0]);
                            setFormData(f => ({ ...f, main_image: url }));
                            toast({ title: 'Main image uploaded' });
                          } catch {
                            toast({ title: 'Failed to upload main image', variant: 'destructive' });
                          }
                        }
                      }}
                      className="w-64"
                    />
                  </div>
                )}
              </div>
            </div>
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
            {/* Global Language-Aware Address */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Address *
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <Input
                  value={currentLanguage === 'en' ? (formData.address_en || '') : (formData.address_id || '')}
                  onChange={e => {
                    if (currentLanguage === 'en') {
                      setFormData(f => ({ ...f, address_en: e.target.value }));
                    } else {
                      setFormData(f => ({ ...f, address_id: e.target.value }));
                    }
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter company address in English" : "Masukkan alamat perusahaan dalam Bahasa Indonesia"}
                  required
                  className="w-full pr-12 border-l-4 border-l-blue-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            {/* Global Language-Aware Description */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Description *
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <Input
                  value={currentLanguage === 'en' ? (formData.description_en || '') : (formData.description_id || '')}
                  onChange={e => {
                    if (currentLanguage === 'en') {
                      setFormData(f => ({ ...f, description_en: e.target.value }));
                    } else {
                      setFormData(f => ({ ...f, description_id: e.target.value }));
                    }
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter company description in English" : "Masukkan deskripsi perusahaan dalam Bahasa Indonesia"}
                  required
                  className="w-full pr-12 border-l-4 border-l-blue-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status ? 'active' : 'inactive'}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData(f => ({ ...f, status: value === 'active' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* --- Dynamic Nested Data Sections --- */}
            <BoxEditor 
              label="Info Box 1" 
              value={migratedBox1} 
              onChange={handleBox1Change}
              currentLanguage={currentLanguage}
            />
            <BoxEditor 
              label="Info Box 2" 
              value={migratedBox2} 
              onChange={handleBox2Change}
              currentLanguage={currentLanguage}
            />
            <div className="mb-4 p-4 bg-gray-50 rounded shadow-sm">
              <div className="font-semibold mb-2">Product Application</div>
              {/* Global Language-Aware Product Application Title */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                  Product Application Title
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                    </svg>
                    {currentLanguage === 'en' ? 'EN' : 'ID'}
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    value={currentLanguage === 'en' ? (formData.data.p?.title_en || formData.data.p?.title || '') : (formData.data.p?.title_id || formData.data.p?.title || '')}
                    onChange={e => {
                      const newValue = e.target.value;
                      setFormData(f => ({ 
                        ...f, 
                        data: { 
                          ...f.data, 
                          p: { 
                            ...f.data.p, 
                            [`title_${currentLanguage}`]: newValue
                          } 
                        } 
                      }));
                    }}
                    placeholder={currentLanguage === 'en' ? "Enter product application title in English" : "Masukkan judul aplikasi produk dalam Bahasa Indonesia"}
                    className="w-full pr-12 border-l-4 border-l-blue-400"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600">
                    {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                  </div>
                </div>
              </div>
              {/* Global Language-Aware Product Application Description */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                  Product Application Description
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                    </svg>
                    {currentLanguage === 'en' ? 'EN' : 'ID'}
                  </span>
                </Label>
                <div className="relative">
                  <textarea
                    value={currentLanguage === 'en' ? (formData.data.p?.description_en || formData.data.p?.description || '') : (formData.data.p?.description_id || formData.data.p?.description || '')}
                    onChange={e => {
                      const newValue = e.target.value;
                      setFormData(f => ({ 
                        ...f, 
                        data: { 
                          ...f.data, 
                          p: { 
                            ...f.data.p, 
                            [`description_${currentLanguage}`]: newValue
                          } 
                        } 
                      }));
                    }}
                    placeholder={currentLanguage === 'en' ? "Enter product application description in English" : "Masukkan deskripsi aplikasi produk dalam Bahasa Indonesia"}
                    className="w-full min-h-[100px] px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical border-l-4 border-l-blue-400"
                    rows={3}
                  />
                  <div className="absolute right-3 top-3 text-xs font-medium text-blue-600">
                    {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                  </div>
                </div>
              </div>
            </div>
            {/* --- Global Language-Aware Titles and Images --- */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Title 1
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <Input
                  value={currentLanguage === 'en' ? (formData.data.title_1_en || formData.data.title_1 || '') : (formData.data.title_1_id || formData.data.title_1 || '')}
                  onChange={e => {
                    const newValue = e.target.value;
                    setFormData(f => ({ 
                      ...f, 
                      data: { 
                        ...f.data, 
                        [`title_1_${currentLanguage}`]: newValue
                      } 
                    }));
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter title 1 in English" : "Masukkan judul 1 dalam Bahasa Indonesia"}
                  className="w-full pr-12 border-l-4 border-l-blue-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            <ImageListEditor label="Images 1" value={formData.data.images_1 || []} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, images_1: v } }))} />
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Title 2
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <Input
                  value={currentLanguage === 'en' ? (formData.data.title_2_en || formData.data.title_2 || '') : (formData.data.title_2_id || formData.data.title_2 || '')}
                  onChange={e => {
                    const newValue = e.target.value;
                    setFormData(f => ({ 
                      ...f, 
                      data: { 
                        ...f.data, 
                        [`title_2_${currentLanguage}`]: newValue
                      } 
                    }));
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter title 2 in English" : "Masukkan judul 2 dalam Bahasa Indonesia"}
                  className="w-full pr-12 border-l-4 border-l-blue-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            <ImageListEditor label="Images 2" value={formData.data.images_2 || []} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, images_2: v } }))} />
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Title 3
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <Input
                  value={currentLanguage === 'en' ? (formData.data.title_3_en || formData.data.title_3 || '') : (formData.data.title_3_id || formData.data.title_3 || '')}
                  onChange={e => {
                    const newValue = e.target.value;
                    setFormData(f => ({ 
                      ...f, 
                      data: { 
                        ...f.data, 
                        [`title_3_${currentLanguage}`]: newValue
                      } 
                    }));
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter title 3 in English" : "Masukkan judul 3 dalam Bahasa Indonesia"}
                  className="w-full pr-12 border-l-4 border-l-blue-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            <ImageListEditor label="Images 3" value={formData.data.images_3 || []} onChange={v => setFormData(f => ({ ...f, data: { ...f.data, images_3: v } }))} />
            {/* --- Global Language-Aware Descriptions --- */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Description 1
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <textarea
                  value={currentLanguage === 'en' ? (formData.data.description_1_en || formData.data.description_1 || '') : (formData.data.description_1_id || formData.data.description_1 || '')}
                  onChange={e => {
                    const newValue = e.target.value;
                    setFormData(f => ({ 
                      ...f, 
                      data: { 
                        ...f.data, 
                        [`description_1_${currentLanguage}`]: newValue
                      } 
                    }));
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter description 1 in English" : "Masukkan deskripsi 1 dalam Bahasa Indonesia"}
                  className="w-full min-h-[100px] px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical border-l-4 border-l-blue-400"
                  rows={3}
                />
                <div className="absolute right-3 top-3 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Description 2
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <textarea
                  value={currentLanguage === 'en' ? (formData.data.description_2_en || formData.data.description_2 || '') : (formData.data.description_2_id || formData.data.description_2 || '')}
                  onChange={e => {
                    const newValue = e.target.value;
                    setFormData(f => ({ 
                      ...f, 
                      data: { 
                        ...f.data, 
                        [`description_2_${currentLanguage}`]: newValue
                      } 
                    }));
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter description 2 in English" : "Masukkan deskripsi 2 dalam Bahasa Indonesia"}
                  className="w-full min-h-[100px] px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical border-l-4 border-l-blue-400"
                  rows={3}
                />
                <div className="absolute right-3 top-3 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                Description 3
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 4h2.764L13 9.236 11.618 12z" clipRule="evenodd" />
                  </svg>
                  {currentLanguage === 'en' ? 'EN' : 'ID'}
                </span>
              </Label>
              <div className="relative">
                <textarea
                  value={currentLanguage === 'en' ? (formData.data.description_3_en || formData.data.description_3 || '') : (formData.data.description_3_id || formData.data.description_3 || '')}
                  onChange={e => {
                    const newValue = e.target.value;
                    setFormData(f => ({ 
                      ...f, 
                      data: { 
                        ...f.data, 
                        [`description_3_${currentLanguage}`]: newValue
                      } 
                    }));
                  }}
                  placeholder={currentLanguage === 'en' ? "Enter description 3 in English" : "Masukkan deskripsi 3 dalam Bahasa Indonesia"}
                  className="w-full min-h-[100px] px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical border-l-4 border-l-blue-400"
                  rows={3}
                />
                <div className="absolute right-3 top-3 text-xs font-medium text-blue-600">
                  {currentLanguage === 'en' ? '🇺🇸' : '🇮🇩'}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}</Button>
            </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
