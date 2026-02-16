// src/pages/Products.tsx
import { useState, useEffect, useRef } from 'react'
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  bulkUploadProducts,
  Product,
  ProductPayload,
  ProductsListData,
} from '@/services/products/productsApi'

// Feature flag from env
const ENABLE_DELETE_ALL_PRODUCTS = import.meta.env.VITE_ENABLE_DELETE_ALL_PRODUCTS === 'true'
import DataTable from '@/components/DataTable'
import ProductFilters from '@/components/ProductFilters'
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
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
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
    segments: string[]
    grpSbus: string[]
    sbuNames: string[]
    grpNames: string[]
  }>({ types: [], applications: [], segments: [], grpSbus: [], sbuNames: [], grpNames: [] })
  const [meta, setMeta] = useState<{
    page: number
    total: number
    pageSize: number
  }>({ page: 1, total: 0, pageSize: 10 })

  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [appFilter, setAppFilter] = useState<string[]>([])
  const [segmentFilter, setSegmentFilter] = useState<string[]>([])
  const [grpSbuFilter, setGrpSbuFilter] = useState<string[]>([])
  const [sbuNameFilter, setSbuNameFilter] = useState<string[]>([])
  const [grpNameFilter, setGrpNameFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const [isTableLoading, setTableLoading] = useState(false)

  // CSV upload state
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    created: number
    errors: { row: number; message: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete all state
  const [isDeleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('')

  // dialog/form state
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductPayload>({
    code: '',
    application_en: '',
    application_id: '',
    performanceFeature_en: '',
    performanceFeature_id: '',
    type: '',
    status: true,
    it_mfg: '',
    segment: '',
    sbu_name: '',
    grp_name: '',
    grp_sbu: '',
    coid: '',
  })

  const columns: any = [
    { key: 'rowNumber' as any, label: 'No' },
    { key: 'code' as const, label: 'Code' },
    { 
      key: 'application_en' as const, 
      label: 'Application',
      render: (application_en: string, item: any) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            🇺🇸 {application_en || item.application || 'No English application'}
          </div>
          <div className="text-xs text-gray-600">
            🇮🇩 {item.application_id || item.application || 'No Indonesian application'}
          </div>
        </div>
      )
    },
    { key: 'type' as const, label: 'Type' },
    { key: 'it_mfg' as const, label: 'IT MFG' },
    { key: 'segment' as const, label: 'Segment' },
    { key: 'sbu_name' as const, label: 'SBU Name' },
    { key: 'grp_name' as const, label: 'GRP Name' },
    { key: 'grp_sbu' as const, label: 'GRP SBU' },
    { key: 'coid' as const, label: 'CoID' },
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
  }, [debouncedSearch, meta.page, meta.pageSize, typeFilter, appFilter, segmentFilter, grpSbuFilter, sbuNameFilter, grpNameFilter, statusFilter])

  async function fetchProducts() {
    setTableLoading(true)
    const filter: Record<string, string | string[]> = {}
    if (debouncedSearch) filter.search = debouncedSearch
    if (typeFilter.length) filter.type = typeFilter
    if (appFilter.length) filter.application = appFilter
    if (segmentFilter.length) filter.segment = segmentFilter
    if (grpSbuFilter.length) filter.grp_sbu = grpSbuFilter
    if (sbuNameFilter.length) filter.sbu_name = sbuNameFilter
    if (grpNameFilter.length) filter.grp_name = grpNameFilter
    if (statusFilter !== 'all') filter.status = statusFilter === 'active' ? 'true' : 'false'
    
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
    setFormData({ 
      code: '', 
      application_en: '',
      application_id: '',
      performanceFeature_en: '', 
      performanceFeature_id: '', 
      type: '', 
      status: true,
      it_mfg: '',
      segment: '',
      sbu_name: '',
      grp_name: '',
      grp_sbu: '',
      coid: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(item: Product) {
    setEditingItem(item)
    setFormData({
      code: item.code,
      application_en: item.application_en || item.application || '',
      application_id: item.application_id || item.application || '',
      performanceFeature_en: item.performanceFeature_en || item.performanceFeature || '',
      performanceFeature_id: item.performanceFeature_id || item.performanceFeature || '',
      type: item.type,
      status: item.status,
      it_mfg: item.it_mfg || '',
      segment: item.segment || '',
      sbu_name: item.sbu_name || '',
      grp_name: item.grp_name || '',
      grp_sbu: item.grp_sbu || '',
      coid: item.coid || '',
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
      application_en: item.application_en || item.application || '',
      application_id: item.application_id || item.application || '',
      performanceFeature_en: item.performanceFeature_en || item.performanceFeature || '',
      performanceFeature_id: item.performanceFeature_id || item.performanceFeature || '',
      type: item.type,
      status: item.status,
      it_mfg: item.it_mfg || '',
      segment: item.segment || '',
      sbu_name: item.sbu_name || '',
      grp_name: item.grp_name || '',
      grp_sbu: item.grp_sbu || '',
      coid: item.coid || '',
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

    // Validation for multi-language fields
    if (!formData.application_en.trim() || !formData.application_id.trim()) {
      toast({ title: 'Please fill in both English and Indonesian application descriptions', variant: 'destructive' })
      setSubmitting(false)
      return
    }
    
    if (!formData.performanceFeature_en.trim() || !formData.performanceFeature_id.trim()) {
      toast({ title: 'Please fill in both English and Indonesian performance features', variant: 'destructive' })
      setSubmitting(false)
      return
    }

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
    setSegmentFilter([])
    setGrpSbuFilter([])
    setSbuNameFilter([])
    setGrpNameFilter([])
    setStatusFilter('all')
    setSearch('')
  }

  // CSV Upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({ title: 'Please select a valid CSV file', variant: 'destructive' })
        return
      }
      setUploadFile(file)
      setUploadResult(null)
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const parseCSV = (content: string): ProductPayload[] => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows')
    }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))
    
    // Map CSV columns to database fields (case-insensitive)
    const columnMap: Record<string, string> = {
      'it_code': 'code',
      'it_mfg': 'it_mfg',
      'segment': 'segment',
      'sbu_name': 'sbu_name',
      'grp_name': 'grp_name',
      'grp_sbu': 'grp_sbu',
      'coid': 'coid'
    }

    const products: ProductPayload[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''))
      
      if (values.length < 2 || values.every(v => !v.trim())) continue // Skip empty rows

      const product: Partial<ProductPayload> = {
        status: true,
        // Default values for required fields
        application_en: '',
        application_id: '',
        performanceFeature_en: '',
        performanceFeature_id: '',
        type: '',
      }

      // Map CSV columns to product fields
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/\s+/g, '_')
        const mappedKey = columnMap[key]
        if (mappedKey && values[index] !== undefined) {
          (product as Record<string, string>)[mappedKey] = values[index]
        }
      })

      // Set type from segment if available, otherwise from grp_sbu
      if (!product.type) {
        product.type = product.segment || product.grp_sbu || 'Coating'
      }

      // Ensure code is set
      if (!product.code) {
        throw new Error(`Row ${i}: Product code (It_Code) is required`)
      }

      products.push(product as ProductPayload)
    }

    return products
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      toast({ title: 'Please select a CSV file', variant: 'destructive' })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const content = await uploadFile.text()
      const products = parseCSV(content)

      if (products.length === 0) {
        toast({ title: 'No valid products found in CSV', variant: 'destructive' })
        setIsUploading(false)
        return
      }

      // Simulate progress
      setUploadProgress(30)
      
      const result = await bulkUploadProducts(products)
      
      setUploadProgress(100)
      
      if (result.success) {
        setUploadResult({
          success: true,
          created: result.data?.created || 0,
          errors: result.data?.errors || []
        })
        toast({ 
          title: `Successfully created ${result.data?.created || 0} products`,
          variant: 'default'
        })
        // Refresh product list
        await fetchProducts()
      } else {
        setUploadResult({
          success: false,
          created: 0,
          errors: [{ row: 0, message: result.message }]
        })
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        created: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Unknown error' }]
      })
      toast({ 
        title: error instanceof Error ? error.message : 'Failed to process CSV', 
        variant: 'destructive' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadFile(null)
    setUploadResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openUploadDialog = () => {
    setUploadDialogOpen(true)
    resetUpload()
  }

  // Delete all handlers
  const handleDeleteAll = async () => {
    if (deleteAllConfirmText !== 'DELETE ALL') {
      toast({ title: 'Please type "DELETE ALL" to confirm', variant: 'destructive' })
      return
    }

    setIsDeletingAll(true)
    try {
      const result = await deleteAllProducts()
      if (result.success) {
        toast({ 
          title: `Successfully deleted ${result.data?.deleted || 0} products`,
          variant: 'default'
        })
        setDeleteAllDialogOpen(false)
        setDeleteAllConfirmText('')
        await fetchProducts()
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : 'Failed to delete all products', 
        variant: 'destructive' 
      })
    } finally {
      setIsDeletingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <ProductFilters
        filterOptions={filterOptions}
        selectedTypes={typeFilter}
        selectedApplications={appFilter}
        selectedSegments={segmentFilter}
        selectedGrpSbus={grpSbuFilter}
        selectedSbuNames={sbuNameFilter}
        selectedGrpNames={grpNameFilter}
        statusFilter={statusFilter}
        search={search}
        onTypeChange={setTypeFilter}
        onApplicationChange={setAppFilter}
        onSegmentChange={setSegmentFilter}
        onGrpSbuChange={setGrpSbuFilter}
        onSbuNameChange={setSbuNameFilter}
        onGrpNameChange={setGrpNameFilter}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearch}
        onClearAll={handleClearAllFilters}
        isLoading={isTableLoading}
      />

      <div className="flex justify-between items-center">
        <DataTable
          data={products.map((product, index) => ({ 
            ...product, 
            id: String(product.id),
            rowNumber: (meta.page - 1) * meta.pageSize + index + 1 
          }))}
          columns={columns}
          onAdd={openAddDialog}
          onEdit={item => openEditDialog({ ...item, id: Number(item.id) } as Product)}
          onDelete={id => handleDelete({ ...products.find(p => String(p.id) === id)!, id: Number(id) } as Product)}
          title="Products"
          searchPlaceholder="Search products..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {ENABLE_DELETE_ALL_PRODUCTS && (
          <Button
            variant="destructive"
            onClick={() => setDeleteAllDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </Button>
        )}
        <Button
          variant="outline"
          onClick={openUploadDialog}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload CSV
        </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8 p-4">
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

            {/* New Fields Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="it_mfg">IT MFG</Label>
                <Input
                  id="it_mfg"
                  value={formData.it_mfg || ''}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, it_mfg: e.target.value }))
                  }
                  placeholder="Enter IT MFG"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="segment">Segment</Label>
                <Input
                  id="segment"
                  value={formData.segment || ''}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, segment: e.target.value }))
                  }
                  placeholder="Enter Segment"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="sbu_name">SBU Name</Label>
                <Input
                  id="sbu_name"
                  value={formData.sbu_name || ''}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, sbu_name: e.target.value }))
                  }
                  placeholder="Enter SBU Name"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="grp_name">GRP Name</Label>
                <Input
                  id="grp_name"
                  value={formData.grp_name || ''}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, grp_name: e.target.value }))
                  }
                  placeholder="Enter GRP Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="grp_sbu">GRP SBU</Label>
                <Input
                  id="grp_sbu"
                  value={formData.grp_sbu || ''}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, grp_sbu: e.target.value }))
                  }
                  placeholder="Enter GRP SBU"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="coid">CoID</Label>
                <Input
                  id="coid"
                  value={formData.coid || ''}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, coid: e.target.value }))
                  }
                  placeholder="Enter CoID"
                />
              </div>
            </div>

            {/* Multi-Language Application Field */}
            <MultiLanguageInput
              label="Application"
              type="text"
              values={{
                en: formData.application_en,
                id: formData.application_id
              }}
              onChange={(values) => 
                setFormData(f => ({ 
                  ...f, 
                  application_en: values.en, 
                  application_id: values.id 
                }))
              }
              required
              placeholder={{
                en: "Enter application description in English",
                id: "Masukkan deskripsi aplikasi dalam Bahasa Indonesia"
              }}
            />

            {/* Multi-Language Performance Features Field */}
            <MultiLanguageInput
              label="Performance Features"
              type="textarea"
              values={{
                en: formData.performanceFeature_en,
                id: formData.performanceFeature_id
              }}
              onChange={(values) => 
                setFormData(f => ({ 
                  ...f, 
                  performanceFeature_en: values.en, 
                  performanceFeature_id: values.id 
                }))
              }
              required
              placeholder={{
                en: "Describe performance features in English...",
                id: "Jelaskan fitur performa dalam Bahasa Indonesia..."
              }}
            />

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
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Upload Products from CSV
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-900 mb-2">CSV Format Requirements:</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Headers: It_Code, It_Mfg, Segment, SBU_Name, Grp_Name, Grp_SBU, CoID</li>
                <li>It_Code is required for each product</li>
                <li>Type will be auto-generated from Segment or Grp_SBU</li>
              </ul>
            </div>

            {/* File Input */}
            {!uploadResult && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadFile ? uploadFile.name : 'Click to select CSV file'}
                    </span>
                    {uploadFile && (
                      <span className="text-xs text-gray-500">
                        {(uploadFile.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </label>
                </div>

                {uploadFile && !isUploading && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUpload}
                      className="text-gray-500"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                    <Button onClick={handleUpload}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Products
                    </Button>
                  </div>
                )}

                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {uploadResult && (
              <div className="space-y-4">
                <div className={`rounded-lg p-4 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {uploadResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                    </span>
                  </div>
                  <p className={`text-sm ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {uploadResult.success
                      ? `Successfully created ${uploadResult.created} products.`
                      : 'There were errors during upload.'}
                  </p>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>Row {error.row}: {error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Close
                  </Button>
                  {uploadResult.success && (
                    <Button onClick={resetUpload}>
                      Upload Another File
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      {ENABLE_DELETE_ALL_PRODUCTS && (
        <Dialog open={isDeleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Delete All Products
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">Warning: This action cannot be undone!</p>
                <p className="text-red-700 text-sm">
                  You are about to delete all {meta.total} products from the database. 
                  This will permanently remove all product data.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <span className="font-bold">DELETE ALL</span> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteAllConfirmText}
                  onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                  placeholder="DELETE ALL"
                  className="border-red-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteAllDialogOpen(false)
                    setDeleteAllConfirmText('')
                  }}
                  disabled={isDeletingAll}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll || deleteAllConfirmText !== 'DELETE ALL'}
                >
                  {isDeletingAll ? (
                    <>
                      <Spinner />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Products
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
