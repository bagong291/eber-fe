// src/pages/Articles.tsx
import { useState, useEffect, ChangeEvent } from 'react'
import { useDebounce } from '@/hooks/use-mobile' // Use debounce hook or implement one
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  Article,
  ArticlePayload,
  UpdateArticlePayload,
  ArticleImagePayload,
  ArticleListResponse,
} from '@/services/articles/articlesApi'
import { useAuthStore } from '@/store/authStore'
import DataTable from '@/components/DataTable'
import ArticleFilters from '@/components/ArticleFilters'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import WysiwygEditor from '@/components/WysiwygEditor'
import { toast } from '@/hooks/use-toast'

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

export default function Articles() {
  const currentUsername = useAuthStore((s) => s.user?.username ?? '')

  const [articles, setArticles] = useState<Article[]>([])
  const [isTableLoading, setTableLoading] = useState(false)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isDialogLoading, setDialogLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)

  const [editingItem, setEditingItem] = useState<Article | null>(null)
  const [formData, setFormData] = useState<{
    title_en: string
    title_id: string
    body_en: string
    body_id: string
    author: string
    group: string
    status: boolean
  }>({
    title_en: '',
    title_id: '',
    body_en: '',
    body_id: '',
    author: currentUsername,
    group: '',
    status: true,
  })
  const [newImage, setNewImage] = useState<ArticleImagePayload | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPayload, setPdfPayload] = useState<{ name: string; extension: string; data: string } | null>(null)
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null)
  // Fixed group options
  const groupOptions = [
    'CSR & Community Engagement',
    'Health, Safety & Environmental',
    'Ethical Governence & Compliance',
    'Eber Magazine',
    'Company Event',
  ]

  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 10, total: 0 })

  // Filter articles by selected group
  const filteredArticles = selectedGroup === 'all'
    ? articles
    : articles.filter(a => a.group === selectedGroup)

  const columns = [
    { key: 'id' as const, label: 'ID' },
    { 
      key: 'title_en' as const, 
      label: 'Title (EN)',
      render: (title_en: string, item: Article) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            🇺🇸 {title_en || item.title || 'No English title'}
          </div>
          <div className="text-xs text-gray-600">
            🇮🇩 {item.title_id || item.title || 'No Indonesian title'}
          </div>
        </div>
      )
    },
    { key: 'author' as const, label: 'Author' },
    { 
      key: 'group' as const, 
      label: 'Group',
      render: (group: string | null) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          group 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {group || 'No Group'}
        </span>
      ),
    },
    {
      key: 'status' as const,
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
      key: 'image' as const,
      label: 'Image',
      render: (imageUrl: string) => (
        <img 
          src={`${import.meta.env.VITE_IMAGE_URL || ''}/${imageUrl}`} 
          alt="Article" 
          className="w-16 h-12 object-cover rounded"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ),
    },
    {
      key: 'createdAt' as const,
      label: 'Created At',
      render: (v: string) => formatDateTime(v),
    },
    {
      key: 'updatedAt' as const,
      label: 'Updated At',
      render: (v: string) => formatDateTime(v),
    },
  ]

  useEffect(() => {
    fetchArticles()
  }, [debouncedSearch, selectedGroup, statusFilter, meta.page, meta.pageSize])

  async function fetchArticles() {
    setTableLoading(true)
    const params: Record<string, string | number> = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (selectedGroup !== 'all') params.group = selectedGroup
    if (statusFilter !== 'all') params.status = statusFilter === 'active' ? 'true' : 'false'
    params.page = meta.page
    params.pageSize = meta.pageSize
    const res = await listArticles(params)
    setTableLoading(false)
    if (res.success) {
      setArticles(res.data.data)
      setMeta(res.data.meta)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  function openAddDialog() {
    setEditingItem(null)
    setFormData({ 
      title_en: '', 
      title_id: '', 
      body_en: '', 
      body_id: '', 
      author: currentUsername, 
      group: '', 
      status: true 
    })
    setNewImage(null)
    setPdfFile(null)
    setPdfPayload(null)
    setExistingPdfUrl(null)
    setDialogOpen(true)
  }

  async function openEditDialog(item: Article) {
    setDialogLoading(true)
    const res = await getArticle(item.id)
    setDialogLoading(false)
    if (!res.success) {
      toast({ title: res.message, variant: 'destructive' })
      return
    }
    setEditingItem(res.data)
    setFormData({
      title_en: res.data.title_en || res.data.title || '',
      title_id: res.data.title_id || res.data.title || '',
      body_en: res.data.body_en || res.data.body || '',
      body_id: res.data.body_id || res.data.body || '',
      author: res.data.author,
      group: res.data.group || '',
      status: res.data.status,
    })
    setNewImage(null)
    setPdfFile(null)
    // If the article has a pdf field, set the existing PDF URL
    setExistingPdfUrl(res.data.pdf ? `${import.meta.env.VITE_IMAGE_URL || ''}${res.data.pdf}` : null)
    setDialogOpen(true)
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      const ext = file.name.split('.').pop() || file.type.split('/')[1]
      setNewImage({ 
        extension: ext, 
        data: base64,
        name: file.name 
      })
    }
    reader.readAsDataURL(file)
  }

  function handlePdfChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      const ext = file.name.split('.').pop() || 'pdf'
      setPdfPayload({ name: file.name, extension: ext, data: base64 })
    }
    reader.readAsDataURL(file)
    setPdfFile(file)
    // If user uploads a new PDF, clear the existing link
    setExistingPdfUrl(null)
  }

  async function handleDelete(item: Article) {
    if (!confirm('Are you sure you want to delete this article?')) return

    setTableLoading(true)

    // Call delete API
    const delRes = await deleteArticle(item.id)
    setTableLoading(false)

    if (delRes.success) {
      toast({ title: 'Deleted successfully' })
      // Re-fetch list so table is up-to-date
      await fetchArticles()
    } else {
      toast({ title: delRes.message, variant: 'destructive' })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    // Validation for multi-language fields
    if (!formData.title_en.trim() || !formData.title_id.trim()) {
      toast({ title: 'Please fill in both English and Indonesian titles', variant: 'destructive' })
      setSubmitting(false)
      return
    }
    
    if (formData.group !== 'Eber Magazine' && (!formData.body_en.trim() || !formData.body_id.trim())) {
      toast({ title: 'Please fill in both English and Indonesian body content', variant: 'destructive' })
      setSubmitting(false)
      return
    }

    let res
    if (editingItem) {
      const updatePayload: UpdateArticlePayload = {
        ...formData,
        // For Eber Magazine, ensure body fields have default values if empty
        ...(formData.group === 'Eber Magazine' && {
          body_en: formData.body_en || 'PDF content',
          body_id: formData.body_id || 'Konten PDF'
        }),
        ...(newImage && { image: newImage }),
        ...(formData.group === 'Eber Magazine' && pdfPayload && { pdf: pdfPayload })
      }
      res = await updateArticle(editingItem.id, updatePayload)
    } else {
      if (!newImage) {
        toast({ title: 'Please select an image', variant: 'destructive' })
        setSubmitting(false)
        return
      }
      if (formData.group === 'Eber Magazine' && !pdfPayload) {
        toast({ title: 'Please upload a PDF for Eber Magazine', variant: 'destructive' })
        setSubmitting(false)
        return
      }
      const createPayload: ArticlePayload = {
        ...formData,
        // For Eber Magazine, ensure body fields have default values if empty
        ...(formData.group === 'Eber Magazine' && {
          body_en: formData.body_en || 'PDF content',
          body_id: formData.body_id || 'Konten PDF'
        }),
        image: newImage,
        ...(formData.group === 'Eber Magazine' && pdfPayload && { pdf: pdfPayload })
      }
      res = await createArticle({ ...createPayload, author: currentUsername })
    }
    setSubmitting(false)
    if (res.success) {
      toast({ title: editingItem ? 'Article updated' : 'Article created' })
      setDialogOpen(false)
      await fetchArticles()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  const previewSrc = newImage
    ? `data:image/${newImage.extension};base64,${newImage.data}`
    : editingItem?.image
    ? `${import.meta.env.VITE_IMAGE_URL || ''}/${editingItem.image}`
    : null

  const handleClearAllFilters = () => {
    setSearch('')
    setSelectedGroup('all')
    setStatusFilter('all')
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <ArticleFilters
        search={search}
        selectedGroup={selectedGroup}
        statusFilter={statusFilter}
        groupOptions={groupOptions}
        onSearchChange={setSearch}
        onGroupChange={setSelectedGroup}
        onStatusChange={setStatusFilter}
        onClearAll={handleClearAllFilters}
        isLoading={isTableLoading}
      />
      <DataTable
        data={articles.map(article => ({ ...article, id: String(article.id) }))}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={(item) => openEditDialog({ ...item, id: Number(item.id) } as Article)}
        onDelete={(id) => handleDelete({ ...articles.find(a => String(a.id) === id)!, id: Number(id) } as Article)}
        title="Articles"
        searchPlaceholder="Search articles..."
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
        <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Article' : 'Add Article'}
            </DialogTitle>
          </DialogHeader>

          {isDialogLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 p-4">
              {/* Group Selection */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="group" className="font-semibold text-base">Group</Label>
                <Select
                  value={formData.group || "none"}
                  onValueChange={(value) => {
                    const newGroup = value === "none" ? "" : value;
                    setFormData((f) => ({ 
                      ...f, 
                      group: newGroup,
                      // For Eber Magazine, set body fields to default values since they're not used
                      ...(newGroup === 'Eber Magazine' && {
                        body_en: 'PDF content',
                        body_id: 'Konten PDF'
                      })
                    }))
                    // Reset PDF when group changes
                    setPdfFile(null)
                    setPdfPayload(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Group</SelectItem>
                    {groupOptions.map((group) => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="image" className="font-semibold text-base">
                  Article Image
                  {editingItem && (
                    <span className="text-sm text-gray-500 ml-2">(Optional - leave empty to keep current image)</span>
                  )}
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <span className="text-xs text-gray-500">Upload a cover image for the article. Recommended size: 800x600px.</span>
                {previewSrc && (
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="mt-2 max-h-40 rounded-md shadow-sm border"
                  />
                )}
              </div>

              {/* Multi-Language Title Field */}
              <MultiLanguageInput
                label="Title"
                type="text"
                values={{
                  en: formData.title_en,
                  id: formData.title_id
                }}
                onChange={(values) => 
                  setFormData(f => ({ 
                    ...f, 
                    title_en: values.en, 
                    title_id: values.id 
                  }))
                }
                required
                placeholder={{
                  en: "Enter article title in English",
                  id: "Masukkan judul artikel dalam Bahasa Indonesia"
                }}
              />
              {/* PDF upload for Eber Magazine, directly under Title */}
              {formData.group === 'Eber Magazine' && (
                <div className="flex flex-col space-y-3 border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 shadow-sm mt-2">
                  <Label htmlFor="pdf" className="font-semibold text-base mb-1 flex items-center gap-2">
                    PDF <span className="text-xs text-blue-700">(Required for Eber Magazine)</span>
                  </Label>
                  {existingPdfUrl && (
                    <div className="mb-2">
                      <span className="block text-xs text-gray-500 mb-1">Current PDF:</span>
                      <a
                        href={existingPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline text-xs font-medium"
                      >
                        View existing PDF
                      </a>
                    </div>
                  )}
                  <Input
                    id="pdf"
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="bg-white border border-blue-200 rounded"
                  />
                  <span className="text-xs text-blue-700">Upload a PDF file for the magazine. Max size: 10MB. Only PDF files are accepted.</span>
                  {pdfFile && (
                    <span className="text-xs text-gray-700 font-medium mt-1">Selected: {pdfFile.name}</span>
                  )}
                </div>
              )}

              {/* Multi-Language Body Field (hidden for Eber Magazine) */}
              {formData.group !== 'Eber Magazine' && (
                <MultiLanguageInput
                  label="Body Content"
                  type="wysiwyg"
                  values={{
                    en: formData.body_en,
                    id: formData.body_id
                  }}
                  onChange={(values) => 
                    setFormData(f => ({ 
                      ...f, 
                      body_en: values.en, 
                      body_id: values.id 
                    }))
                  }
                  required
                  placeholder={{
                    en: "Write your article content in English...",
                    id: "Tulis konten artikel dalam Bahasa Indonesia..."
                  }}
                />
              )}

              {/* Status Field */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="status" className="font-semibold text-base">Status</Label>
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

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t pt-6 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
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
