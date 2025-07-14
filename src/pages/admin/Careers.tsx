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
    description: '',
  })

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 10, total: 0 })

  const columns = [
    { key: 'id' as keyof Career, label: 'id' },
    { key: 'position' as keyof Career, label: 'Position' },
    { key: 'location' as keyof Career, label: 'Location' },
    { key: 'type' as keyof Career, label: 'Type' },
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
  }, [debouncedSearch, meta.page, meta.pageSize])

  const fetchCareers = async () => {
    setTableLoading(true)
    const params: Record<string, string | number> = {}
    if (debouncedSearch) params.search = debouncedSearch
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
      description: '',
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
        description: res.data.description,
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

  return (
    <div>
      {/* Search bar */}
      <div className="flex items-center mb-4 space-x-4">
        <Input
          className="max-w-sm"
          placeholder="Search job openings..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <DataTable
        data={careers.map(career => ({ ...career, id: String(career.id) }))}
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
              </div>

              <div>
                <Label>Job Description</Label>
                <WysiwygEditor
                  value={formData.description}
                  onChange={(value) =>
                    setFormData((f) => ({ ...f, description: value }))
                  }
                  placeholder="Enter job description..."
                />
              </div>

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
