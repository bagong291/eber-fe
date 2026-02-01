// src/pages/Careers.tsx
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-mobile' // Use debounce hook or implement one
import {
  listCareers,
  getCareer,
  createCareer,
  updateCareer,
  deleteCareer,
  Career,
  CareerPayload,
  CareerListResponse,
} from '@/services/career/careerApi'
import DataTable from '@/components/DataTable'
import CareerFilters from '@/components/CareerFilters'
import MultiLanguageInput from '@/components/MultiLanguageInput'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import WysiwygEditor from '@/components/WysiwygEditor'
import { toast } from '@/hooks/use-toast'

// Simple spinner component
const Spinner = () => (
  <div
    className="w-6 h-6 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin"
    aria-label="Loading"
  />
)

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const Careers = () => {
  const [careers, setCareers] = useState<Career[]>([])
  const [isTableLoading, setTableLoading] = useState(false)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isDialogLoading, setDialogLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)

  const [editingItem, setEditingItem] = useState<Career | null>(null)
  const [formData, setFormData] = useState<CareerPayload>({
    position: '',
    location: '',
    type: 'fulltime',
    description_en: '',
    description_id: '',
    status: true,
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const debouncedSearch = useDebounce(search, 400)
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 10, total: 0 })

  const columns = [
    { key: 'rowNumber' as any, label: 'No' },
    { key: 'position' as keyof Career, label: 'Position' },
    { key: 'location' as keyof Career, label: 'Location' },
    { key: 'type' as keyof Career, label: 'Type' },
    {
      key: 'status' as keyof Career,
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt' as keyof Career,
      label: 'Created At',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'updatedAt' as keyof Career,
      label: 'Updated At',
      render: (value: string) => formatDateTime(value),
    },
  ]

  useEffect(() => {
    fetchCareers()
  }, [debouncedSearch, statusFilter, meta.page, meta.pageSize])

  const fetchCareers = async () => {
    setTableLoading(true)
    const params: Record<string, string | number> = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter !== 'all') params.status = statusFilter === 'active' ? 'true' : 'false'
    params.page = meta.page
    params.pageSize = meta.pageSize
    const res = await listCareers(params)
    setTableLoading(false)
    if (res.success) {
      setCareers(res.data.data)
      setMeta(res.data.meta)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  const openAddDialog = () => {
    setEditingItem(null)
    setFormData({
      position: '',
      location: '',
      type: 'fulltime',
      description_en: '',
      description_id: '',
      status: true,
    })
    setDialogOpen(true)
  }

  const openEditDialog = async (item: Career) => {
    setDialogLoading(true)
    const res = await getCareer(item.id)
    setDialogLoading(false)

    if (res.success) {
      setEditingItem(res.data)
      setFormData({
        position: res.data.position,
        location: res.data.location,
        type: res.data.type,
        description_en: res.data.description_en || res.data.description || '',
        description_id: res.data.description_id || res.data.description || '',
        status: res.data.status,
      })
      setDialogOpen(true)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (item: Career) => {
    if (!window.confirm('Are you sure you want to delete this job opening?')) {
      return
    }

    setTableLoading(true)
    const res = await deleteCareer(item.id)
    setTableLoading(false)

    if (res.success) {
      setCareers((prev) => prev.filter((c) => c.id !== item.id))
      toast({ title: 'Deleted successfully' })
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Validation for multi-language job description
    if (!formData.description_en.trim() || !formData.description_id.trim()) {
      toast({ title: 'Please fill in both English and Indonesian job descriptions', variant: 'destructive' })
      setSubmitting(false)
      return
    }

    let res
    if (editingItem) {
      res = await updateCareer(editingItem.id, formData)
    } else {
      res = await createCareer(formData)
    }

    setSubmitting(false)
    if (res.success) {
      if (editingItem) {
        setCareers((prev) =>
          prev.map((c) => (c.id === editingItem.id ? res.data : c))
        )
        toast({ title: 'Job opening updated successfully' })
      } else {
        setCareers((prev) => [res.data, ...prev])
        toast({ title: 'Job opening created successfully' })
      }
      setDialogOpen(false)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  const handleClearAllFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <CareerFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onClearAll={handleClearAllFilters}
        isLoading={isTableLoading}
      />
      <DataTable
        data={careers.map((career, index) => ({ 
          ...career, 
          id: String(career.id),
          rowNumber: (meta.page - 1) * meta.pageSize + index + 1 
        }))}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={item => { openEditDialog({ ...item, id: Number(item.id) } as Career) }}
        onDelete={id => { const career = careers.find(c => String(c.id) === id); if (career) handleDelete({ ...career, id: Number(career.id) } as Career); }}
        title="Job Openings"
        searchPlaceholder="Search job openings..."
      />
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

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Job Opening' : 'Add Job Opening'}
            </DialogTitle>
          </DialogHeader>

          {isDialogLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, position: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, location: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Employment Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: CareerPayload['type']) =>
                      setFormData((f) => ({ ...f, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fulltime">Full-time</SelectItem>
                      <SelectItem value="parttime">Part-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status ? 'active' : 'inactive'}
                    onValueChange={(value: 'active' | 'inactive') =>
                      setFormData((f) => ({ ...f, status: value === 'active' }))
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
              </div>

              {/* Multi-Language Job Description */}
              <MultiLanguageInput
                label="Job Description"
                type="wysiwyg"
                values={{
                  en: formData.description_en,
                  id: formData.description_id
                }}
                onChange={(values) => 
                  setFormData(f => ({ 
                    ...f, 
                    description_en: values.en, 
                    description_id: values.id 
                  }))
                }
                required
                placeholder={{
                  en: "Enter job description in English...",
                  id: "Masukkan deskripsi pekerjaan dalam Bahasa Indonesia..."
                }}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Careers
