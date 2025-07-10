// src/pages/Careers.tsx
import { useState, useEffect } from 'react'
import {
  listCareers,
  getCareer,
  createCareer,
  updateCareer,
  deleteCareer,
  Career,
  CareerPayload,
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
  }, [])

  const fetchCareers = async () => {
    setTableLoading(true)
    const res = await listCareers()
    setTableLoading(false)

    if (res.success) {
      setCareers(res.data)
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
      <DataTable
        data={careers}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        title="Job Openings"
        searchPlaceholder="Search job openings..."
        loading={isTableLoading}
      />

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
