import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Star, Trash2, Search, Building2, Package } from 'lucide-react'
import {
  listCompanyTopProducts,
  addCompanyTopProduct,
  removeCompanyTopProduct,
  CompanyTopProductGroup,
  CompanyTopProductItem,
} from '@/services/companyTopProducts/companyTopProductsApi'
import { listProducts, Product } from '@/services/products/productsApi'

const Spinner = () => (
  <div
    className="w-6 h-6 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin"
    aria-label="Loading"
  />
)

export default function CompanyTopProducts() {
  const [companies, setCompanies] = useState<CompanyTopProductGroup[]>([])
  const [isLoading, setLoading] = useState(false)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)

  // Dialog state
  const [selectedCompany, setSelectedCompany] = useState<CompanyTopProductGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedRank, setSelectedRank] = useState<number>(1)

  useEffect(() => {
    fetchData()
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!isDialogOpen) return
    
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch()
      } else {
        setSearchResults([])
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, isDialogOpen])

  async function performSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const res = await listProducts({ search: searchQuery }, 1, 50)
    setSearching(false)

    if (res.success) {
      // Filter out products that are already in this company's top 3
      const existingProductIds = selectedCompany?.topProducts.map(tp => tp.product.id) || []
      const filtered = res.data.data.filter(p => !existingProductIds.includes(p.id))
      
      // Sort by segment for better grouping display
      const sorted = filtered.sort((a, b) => {
        const segmentA = a.segment || 'Others'
        const segmentB = b.segment || 'Others'
        return segmentA.localeCompare(segmentB)
      })
      
      setSearchResults(sorted)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  async function fetchData() {
    setLoading(true)
    const res = await listCompanyTopProducts()
    setLoading(false)
    if (res.success) {
      setCompanies(res.data)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }


  function openAddDialog(company: CompanyTopProductGroup) {
    if (company.topProducts.length >= 3) {
      toast({ title: 'Maximum 3 products allowed per company', variant: 'destructive' })
      return
    }

    setSelectedCompany(company)
    setSelectedProduct(null)
    setSelectedRank(company.topProducts.length + 1)
    setSearchQuery('')
    setSearchResults([])
    setDialogOpen(true)
  }

  async function handleAdd() {
    if (!selectedCompany || !selectedProduct) {
      toast({ title: 'Please select a product', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    const res = await addCompanyTopProduct({
      company_profile_id: selectedCompany.company.id,
      product_id: selectedProduct.id,
      rank: selectedRank,
    })
    setSubmitting(false)

    if (res.success) {
      toast({ title: 'Product added to company top 3' })
      setDialogOpen(false)
      await fetchData()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  async function handleRemove(item: CompanyTopProductItem) {
    if (!window.confirm('Remove this product from company top 3?')) {
      return
    }

    setLoading(true)
    const res = await removeCompanyTopProduct(item.id)
    setLoading(false)

    if (res.success) {
      toast({ title: 'Product removed' })
      await fetchData()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Top Products</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage top 3 products for each company profile
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow">
          <Spinner />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No companies found</p>
          <p className="text-sm text-gray-400 mt-1">
            Create company profiles first
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {companies.map((company) => (
            <div
              key={company.company.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Company Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-6 w-6" />
                      <div>
                        <h2 className="text-xl font-bold">{company.company.name}</h2>
                        <p className="text-purple-100 text-sm mt-1">
                          {company.company.location}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-purple-100">Top Products</div>
                    <div className="text-2xl font-bold">
                      {company.topProducts.length}/3
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Products List */}
              <div className="p-6">
                {company.topProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No top products yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {company.topProducts.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* Rank Badge */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                            {item.rank}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {item.product.segment || item.product.code}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {item.product.application_en || item.product.type}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.product.status
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.product.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Product Button */}
                {company.topProducts.length < 3 && (
                  <Button
                    onClick={() => openAddDialog(company)}
                    variant="outline"
                    className="w-full border-dashed border-2 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Add Product ({company.topProducts.length}/3)
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Add Top Product - {selectedCompany?.company.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Rank Selection */}
            <div>
              <Label htmlFor="rank">Rank Position</Label>
              <Select
                value={selectedRank.toString()}
                onValueChange={(value) => setSelectedRank(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">🥇 Rank 1</SelectItem>
                  <SelectItem value="2">🥈 Rank 2</SelectItem>
                  <SelectItem value="3">🥉 Rank 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Search */}
            <div>
              <Label htmlFor="search">Search Product</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by segment, code, or name..."
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                />
                <Button
                  onClick={performSearch}
                  disabled={isSearching}
                  variant="outline"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {isSearching ? (
              <div className="flex items-center justify-center p-8">
                <Spinner />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {(() => {
                  // Group products by segment
                  const grouped = searchResults.reduce((acc, product) => {
                    const segment = product.segment || 'Others'
                    if (!acc[segment]) {
                      acc[segment] = []
                    }
                    acc[segment].push(product)
                    return acc
                  }, {} as Record<string, Product[]>)

                  return Object.entries(grouped).map(([segment, products]) => (
                    <div key={segment} className="border-b last:border-b-0">
                      {/* Segment Header */}
                      <div className="bg-gray-100 px-4 py-2 font-semibold text-sm text-gray-700 sticky top-0">
                        {segment} ({products.length})
                      </div>
                      {/* Products in this segment */}
                      <div className="divide-y">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedProduct?.id === product.id
                                ? 'bg-purple-50 border-l-4 border-purple-600'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {product.segment || product.code}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {product.application_en || product.type}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Code: {product.code}
                                </p>
                              </div>
                              {selectedProduct?.id === product.id && (
                                <div className="text-purple-600 font-semibold ml-2">✓</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No products found</p>
              </div>
            ) : null}

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Selected Product:</h4>
                <div className="text-sm text-green-800">
                  <div><strong>Segment:</strong> {selectedProduct.segment || selectedProduct.code}</div>
                  <div><strong>Type:</strong> {selectedProduct.type}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedProduct || isSubmitting}
              >
                {isSubmitting ? <Spinner /> : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
