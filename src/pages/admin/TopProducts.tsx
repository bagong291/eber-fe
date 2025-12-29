import { useState, useEffect } from 'react'
import {
  listTopProducts,
  addTopProduct,
  updateTopProductRank,
  removeTopProduct,
  TopProduct,
} from '@/services/topProducts/topProductsApi'
import { listProducts, Product } from '@/services/products/productsApi'
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
import { Star, Trash2, Search, MoveUp, MoveDown } from 'lucide-react'

const Spinner = () => (
  <div
    className="w-6 h-6 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin"
    aria-label="Loading"
  />
)

export default function TopProducts() {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [isLoading, setLoading] = useState(false)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)

  // Product search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedRank, setSelectedRank] = useState<number>(1)

  useEffect(() => {
    fetchTopProducts()
  }, [])

  async function fetchTopProducts() {
    setLoading(true)
    const res = await listTopProducts()
    setLoading(false)
    if (res.success) {
      setTopProducts(res.data)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const res = await listProducts({ search: searchQuery }, 1, 20)
    setSearching(false)

    if (res.success) {
      // Filter out products that are already in top 10
      const topProductIds = topProducts.map(tp => tp.product_id)
      const filtered = res.data.data.filter(p => !topProductIds.includes(p.id))
      setSearchResults(filtered)
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  function openAddDialog() {
    setSelectedProduct(null)
    setSelectedRank(topProducts.length + 1)
    setSearchQuery('')
    setSearchResults([])
    setDialogOpen(true)
  }

  async function handleAdd() {
    if (!selectedProduct) {
      toast({ title: 'Please select a product', variant: 'destructive' })
      return
    }

    if (topProducts.length >= 10) {
      toast({ title: 'Maximum 10 products allowed', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    const res = await addTopProduct({
      product_id: selectedProduct.id,
      rank: selectedRank,
    })
    setSubmitting(false)

    if (res.success) {
      toast({ title: 'Product added to Top 10' })
      setDialogOpen(false)
      await fetchTopProducts()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  async function handleRemove(id: number) {
    if (!window.confirm('Remove this product from Top 10?')) {
      return
    }

    setLoading(true)
    const res = await removeTopProduct(id)
    setLoading(false)

    if (res.success) {
      toast({ title: 'Product removed from Top 10' })
      await fetchTopProducts()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  async function handleMoveUp(item: TopProduct) {
    if (item.rank === 1) return

    setLoading(true)
    const res = await updateTopProductRank(item.id, item.rank - 1)
    setLoading(false)

    if (res.success) {
      await fetchTopProducts()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  async function handleMoveDown(item: TopProduct) {
    if (item.rank === topProducts.length) return

    setLoading(true)
    const res = await updateTopProductRank(item.id, item.rank + 1)
    setLoading(false)

    if (res.success) {
      await fetchTopProducts()
    } else {
      toast({ title: res.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Top 10 Products</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your featured products ({topProducts.length}/10)
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          disabled={topProducts.length >= 10 || isLoading}
        >
          <Star className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Top Products List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner />
          </div>
        ) : topProducts.length === 0 ? (
          <div className="text-center p-12">
            <Star className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No top products yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add products to feature them
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {topProducts.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {item.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {item.product.code}
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <div>🇺🇸 {item.product.application_en}</div>
                      <div>🇮🇩 {item.product.application_id}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {item.product.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveUp(item)}
                    disabled={item.rank === 1 || isLoading}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveDown(item)}
                    disabled={item.rank === topProducts.length || isLoading}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove(item.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product to Top 10</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Products */}
            <div>
              <Label htmlFor="search">Search Product</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="search"
                  placeholder="Search by code or application..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Spinner /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <div className="divide-y">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="font-medium">{product.code}</div>
                      <div className="text-sm text-gray-600">
                        {product.application_en || product.application}
                      </div>
                      <div className="text-xs text-gray-500">
                        Type: {product.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Product */}
            {selectedProduct && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <Label className="text-sm font-semibold">Selected Product</Label>
                <div className="mt-2">
                  <div className="font-medium">{selectedProduct.code}</div>
                  <div className="text-sm text-gray-600">
                    {selectedProduct.application_en || selectedProduct.application}
                  </div>
                </div>
              </div>
            )}

            {/* Rank Selection */}
            <div>
              <Label htmlFor="rank">Rank Position</Label>
              <Select
                value={String(selectedRank)}
                onValueChange={(value) => setSelectedRank(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.min(10, topProducts.length + 1) }, (_, i) => i + 1).map(
                    (rank) => (
                      <SelectItem key={rank} value={String(rank)}>
                        Rank {rank}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedProduct || isSubmitting}
              >
                {isSubmitting ? <Spinner /> : 'Add to Top 10'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
