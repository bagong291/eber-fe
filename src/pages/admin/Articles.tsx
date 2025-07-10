// src/pages/Articles.tsx
import { useState, useEffect, ChangeEvent } from 'react'
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
} from '@/services/articles/articlesApi'
import { useAuthStore } from '@/store/authStore'
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
    title: string
    body: string
    author: string
    group: string
  }>({
    title: '',
    body: '',
    author: currentUsername,
    group: '',
  })
  const [newImage, setNewImage] = useState<ArticleImagePayload | null>(null)

  const columns = [
    { key: 'id' as const, label: 'ID' },
    { key: 'title' as const, label: 'Title' },
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
      key: 'image' as const,
      label: 'Image',
      render: (imageUrl: string) => (
        <img 
          src={`${import.meta.env.VITE_IMAGE_URL || ''}${imageUrl}`} 
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
  }, [])

  async function fetchArticles() {
    setTableLoading(true)
    const res = await listArticles()
    setTableLoading(false)
    if (res.success) {
      setArticles(res.data)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  function openAddDialog() {
    setEditingItem(null)
    setFormData({ title: '', body: '', author: currentUsername, group: '' })
    setNewImage(null)
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
      title: res.data.title,
      body: res.data.body,
      author: res.data.author,
      group: res.data.group || '',
    })
    console.log(res.data)
    setNewImage(null)
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

    let res
    if (editingItem) {
      // For updates, only include image if a new one was selected
      const updatePayload: UpdateArticlePayload = {
        ...formData,
        ...(newImage && { image: newImage })
      }
      
      res = await updateArticle(editingItem.id, updatePayload)
    } else {
      // For new articles, image is required
      if (!newImage) {
        toast({ title: 'Please select an image', variant: 'destructive' })
        setSubmitting(false)
        return
      }

      const createPayload: ArticlePayload = {
        ...formData,
        image: newImage,
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
    ? `${import.meta.env.VITE_IMAGE_URL || ''}${editingItem.image}`
    : null

  return (
    <div>
      <DataTable
        data={articles.map(article => ({ ...article, id: String(article.id) }))}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={(item) => openEditDialog({ ...item, id: Number(item.id) } as Article)}
        onDelete={(id) => handleDelete({ ...articles.find(a => String(a.id) === id)!, id: Number(id) } as Article)}
        title="Articles"
        searchPlaceholder="Search articles..."
      />

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
            <form onSubmit={handleSubmit} className="space-y-6 p-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="image">
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
                {previewSrc && (
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="mt-2 max-h-40 rounded-md shadow-sm"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" value={formData.author} readOnly />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="group">Group</Label>
                  <Select
                    value={formData.group || "none"}
                    onValueChange={(value) =>
                      setFormData((f) => ({ ...f, group: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Group</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <Label>Body</Label>
                <WysiwygEditor
                  value={formData.body}
                  onChange={(v) =>
                    setFormData((f) => ({ ...f, body: v }))
                  }
                  placeholder="Write your article..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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
