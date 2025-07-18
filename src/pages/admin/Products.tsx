// src/pages/Products.tsx
import { useState, useEffect } from 'react'
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
  ProductPayload,
  ProductsListData,
} from '@/services/products/productsApi'
import DataTable from '@/components/DataTable'
import ProductFilters from '@/components/ProductFilters'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WysiwygEditor from '@/components/WysiwygEditor'
import { toast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/use-mobile' // Use debounce hook or implement one

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

export default function Products() {
  // table + pagination/filter state
  const [products, setProducts] = useState<Product[]>([])
  const [filterOptions, setFilterOptions] = useState<{
    types: string[]
    applications: string[]
  }>({ types: [], applications: [] })
  const [meta, setMeta] = useState<{
    page: number
    total: number
    pageSize: number
  }>({ page: 1, total: 0, pageSize: 10 })

  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [appFilter, setAppFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const [isTableLoading, setTableLoading] = useState(false)

  // dialog/form state
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductPayload>({
    code: '',
    application: '',
    performanceFeature: '',
    type: '',
  })

  const columns = [
    { key: 'id' as const, label: 'ID' },
    { key: 'code' as const, label: 'Code' },
    { key: 'application' as const, label: 'Application' },
    { key: 'performanceFeature' as const, label: 'Feature' },
    { key: 'type' as const, label: 'Type' },
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
    fetchProducts()
  }, [debouncedSearch, meta.page, meta.pageSize, typeFilter, appFilter])

  async function fetchProducts() {
    setTableLoading(true)
    const filter: Record<string, string | string[]> = {}
    if (debouncedSearch) filter.search = debouncedSearch
    if (typeFilter.length) filter.type = typeFilter
    if (appFilter.length) filter.application = appFilter
    
    const res = await listProducts(filter, meta.page, meta.pageSize)
    setTableLoading(false)
    if (res.success) {
      const d = res.data as ProductsListData
      setProducts(d.data)
      setFilterOptions(d.filter_feature)
      setMeta(d.meta)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  function openAddDialog() {
    setEditingItem(null)
    setFormData({ code: '', application: '', performanceFeature: '', type: '' })
    setDialogOpen(true)
  }

  function openEditDialog(item: Product) {
    setEditingItem(item)
    setFormData({
      code: item.code,
      application: item.application,
      performanceFeature: item.performanceFeature,
      type: item.type,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (item: Product) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    setTableLoading(true)

    const payload: ProductPayload = {
      code: item.code,
      application: item.application,
      performanceFeature: item.performanceFeature,
      type: item.type,
    }

    // call deleteProduct with id and payload
    const res = await deleteProduct(item.id, payload)
    setTableLoading(false)

    if (res.success) {
      toast({ title: 'Deleted successfully' })
      // ❇️ re-fetch so table, filters, and meta are all up-to-date
      await fetchProducts()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    let res
    if (editingItem) {
      res = await updateProduct(editingItem.id, formData)
    } else {
      res = await createProduct(formData)
    }

    setSubmitting(false)

    if (res.success) {
      if (editingItem) {
        toast({ title: 'Product updated' })
      } else {
        toast({ title: 'Product created' })
      }
      setDialogOpen(false)
      // after create/update, also re-fetch to reflect new total, filters, etc.
      await fetchProducts()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  const handleClearAllFilters = () => {
    setTypeFilter([])
    setAppFilter([])
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <ProductFilters
        filterOptions={filterOptions}
        selectedTypes={typeFilter}
        selectedApplications={appFilter}
        onTypeChange={setTypeFilter}
        onApplicationChange={setAppFilter}
        onClearAll={handleClearAllFilters}
        isLoading={isTableLoading}
      />

      <DataTable
        data={products.map(product => ({ ...product, id: String(product.id) }))}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={item => openEditDialog({ ...item, id: Number(item.id) } as Product)}
        onDelete={id => handleDelete({ ...products.find(p => String(p.id) === id)!, id: Number(id) } as Product)}
        title="Products"
        searchPlaceholder="Search products..."
        searchValue={search}
        onSearchChange={setSearch}
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
              {editingItem ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, code: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, type: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="application">Application</Label>
              <Input
                id="application"
                value={formData.application}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, application: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label>Performance Features</Label>
              <WysiwygEditor
                value={formData.performanceFeature}
                onChange={(v) =>
                  setFormData((f) => ({ ...f, performanceFeature: v }))
                }
                placeholder="Describe performance features..."
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
