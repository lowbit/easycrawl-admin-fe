import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  getProductById,
  processSpecificItem,
  getVariantPriceHistory,
  ProductVariantDTO,
  ProductVariantFilterParams,
  PriceHistoryDTO
} from '@/services/productService';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  RefreshCw, 
  Play,
  ExternalLink,
  RotateCw,
  Info,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Columns,
  LineChart,
  Clock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<ProductVariantFilterParams>({
    page: 0,
    pageSize: 10,
    sort: 'websiteName,asc'
  });
  
  // Search terms states
  const [titleSearch, setTitleSearch] = useState('');
  const [websiteSearch, setWebsiteSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [sizeSearch, setSizeSearch] = useState('');
  const [inStockOnly, setInStockOnly] = useState<boolean | undefined>(undefined);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    retailer: true,
    title: true,
    price: true,
    oldPrice: false,
    discount: true,
    color: false,
    size: false,
    currency: false,
  });

  // Add state for price history
  const [priceHistoryDialogOpen, setPriceHistoryDialogOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryDTO[]>([]);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState(false);

  const productId = parseInt(id || '0', 10);

  const { 
    data: variantsPage, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['product-variants', productId, filters],
    queryFn: () => getProductById(productId, filters),
    enabled: !!productId,
  });
  
  // Extract product info from the first variant if available
  const productInfo = variantsPage?.content?.[0] ? {
    id: productId,
    name: variantsPage.content[0].title?.split(' - ')[0] || 'Unknown Product', // Extract product name from variant title
    brand: '', // Not available from variant
    model: '',  // Not available from variant
    category: '', // Not available from variant
    imageUrl: variantsPage.content[0].imageUrl
  } : null;
  
  const variants = variantsPage?.content || [];
  const totalPages = variantsPage?.totalPages || 0;
  const totalElements = variantsPage?.totalElements || 0;
  const currentPage = variantsPage?.number || 0;

  const handleBack = () => {
    navigate('/products');
  };

  const handleProcessItem = async () => {
    setIsProcessing(true);
    try {
      const result = await processSpecificItem(productId);
      if (result.success) {
        toast.success('Product processed successfully');
        refetch(); // Refresh product data
      } else {
        toast.error(`Failed to process product: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing product:', error);
      toast.error('Failed to process product');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format price with currency
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'BAM',
      minimumFractionDigits: 0,
    }).format(price).replace('BAM', 'KM');
  };
  
  // Handle applying filters
  const applyFilters = (field: string, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      page: 0, // Reset to first page when filtering
      [field]: value === '' ? undefined : value
    }));
  };
  
  // Handle clearing filters
  const resetFilters = () => {
    setTitleSearch('');
    setWebsiteSearch('');
    setColorSearch('');
    setSizeSearch('');
    setInStockOnly(undefined);
    
    setFilters({
      page: 0,
      pageSize: filters.pageSize,
      sort: filters.sort
    });
  };
  
  // Handle sorting
  const handleSort = (column: string) => {
    const currentSort = filters.sort || '';
    const [currentColumn, currentDirection] = currentSort.split(',');
    
    const direction = currentColumn === column && currentDirection === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({
      ...prev,
      sort: `${column},${direction}`
    }));
  };
  
  // Get current sort direction for a column
  const getSortDirection = (column: string) => {
    const currentSort = filters.sort || '';
    const [currentColumn, direction] = currentSort.split(',');
    return currentColumn === column ? direction : undefined;
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  // Handle items per page change
  const handlePageSizeChange = (size: number) => {
    setFilters(prev => ({
      ...prev,
      page: 0,
      pageSize: size
    }));
  };

  // Add function to handle showing price history
  const handleShowPriceHistory = async (variantId: number) => {
    setSelectedVariantId(variantId);
    setPriceHistoryDialogOpen(true);
    setIsLoadingPriceHistory(true);
    
    try {
      const history = await getVariantPriceHistory(variantId);
      setPriceHistory(history);
    } catch (error) {
      console.error('Error fetching price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setIsLoadingPriceHistory(false);
    }
  };
  
  // Add function to format date for price history
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Product Details</h1>
          {productId && <Badge variant="outline" className="ml-2">ID: {productId}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={handleProcessItem}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Process Item
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuCheckboxItem
                checked={columnVisibility.retailer}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, retailer: checked }))
                }
              >
                Retailer
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.title}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, title: checked }))
                }
              >
                Title
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.price}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, price: checked }))
                }
              >
                Price
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.oldPrice}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, oldPrice: checked }))
                }
              >
                Old Price
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.discount}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, discount: checked }))
                }
              >
                Discount
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.color}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, color: checked }))
                }
              >
                Color
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.size}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, size: checked }))
                }
              >
                Size
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.currency}
                onCheckedChange={(checked) => 
                  setColumnVisibility(prev => ({ ...prev, currency: checked }))
                }
              >
                Currency
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm" variant="outline" onClick={resetFilters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Product image and basic info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Basic product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productInfo?.imageUrl ? (
                <div className="rounded-md overflow-hidden">
                  <img 
                    src={productInfo.imageUrl} 
                    alt={productInfo.name}
                    className="w-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-muted w-full h-64 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              
              <div className="space-y-4">
                {productInfo && <h3 className="text-lg font-semibold">{productInfo.name}</h3>}
                
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm font-medium text-muted-foreground">ID</div>
                  <div className="text-sm">{productId}</div>
                  
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <div className="text-sm">{productInfo?.name || 'N/A'}</div>
                  
                  <div className="text-sm font-medium text-muted-foreground">Variants</div>
                  <div className="text-sm">{totalElements || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column - Tabs with details, variants, etc. */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>
                  View all product variants from different retailers
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <div className="flex mt-1">
                      <Input
                        placeholder="Filter by title"
                        value={titleSearch}
                        onChange={(e) => {
                          setTitleSearch(e.target.value);
                          applyFilters('title', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex mt-1">
                      <Input
                        placeholder="Filter by website"
                        value={websiteSearch}
                        onChange={(e) => {
                          setWebsiteSearch(e.target.value);
                          applyFilters('websiteCode', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex mt-1">
                      <Input
                        placeholder="Filter by color"
                        value={colorSearch}
                        onChange={(e) => {
                          setColorSearch(e.target.value);
                          applyFilters('color', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex mt-1">
                      <Input
                        placeholder="Filter by size"
                        value={sizeSearch}
                        onChange={(e) => {
                          setSizeSearch(e.target.value);
                          applyFilters('size', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Checkbox 
                        id="in-stock" 
                        checked={inStockOnly === true}
                        onCheckedChange={(checked) => {
                          setInStockOnly(checked ? true : undefined);
                          applyFilters('inStock', checked ? true : undefined);
                        }}
                      />
                      <label htmlFor="in-stock" className="text-sm">
                        In Stock Only
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Variants Table */}
              {variants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No variants found for this product.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columnVisibility.retailer && (
                            <TableHead 
                              className="cursor-pointer"
                              onClick={() => handleSort('websiteName')}
                            >
                              Retailer
                              {getSortDirection('websiteName') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                              {getSortDirection('websiteName') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                            </TableHead>
                          )}
                          
                          {columnVisibility.title && (
                            <TableHead 
                              className="cursor-pointer"
                              onClick={() => handleSort('title')}
                            >
                              Title
                              {getSortDirection('title') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                              {getSortDirection('title') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                            </TableHead>
                          )}
                          
                          {columnVisibility.price && (
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => handleSort('price')}
                            >
                              Price
                              {getSortDirection('price') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                              {getSortDirection('price') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                            </TableHead>
                          )}
                          
                          {columnVisibility.oldPrice && (
                            <TableHead className="text-right">Old Price</TableHead>
                          )}
                          
                          {columnVisibility.discount && (
                            <TableHead className="text-right">Discount</TableHead>
                          )}
                          
                          {columnVisibility.color && (
                            <TableHead>Color</TableHead>
                          )}
                          
                          {columnVisibility.size && (
                            <TableHead>Size</TableHead>
                          )}
                          
                          {columnVisibility.currency && (
                            <TableHead>Currency</TableHead>
                          )}
                          
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant: ProductVariantDTO) => (
                          <TableRow key={variant.id}>
                            {columnVisibility.retailer && (
                              <TableCell>
                                <div className="font-medium">{variant.websiteName}</div>
                                <div className="text-xs text-muted-foreground">{variant.websiteCode}</div>
                              </TableCell>
                            )}
                            
                            {columnVisibility.title && (
                              <TableCell>{variant.title}</TableCell>
                            )}
                            
                            {columnVisibility.price && (
                              <TableCell className="text-right">{formatPrice(variant.price)}</TableCell>
                            )}
                            
                            {columnVisibility.oldPrice && (
                              <TableCell className="text-right">{formatPrice(variant.oldPrice)}</TableCell>
                            )}
                            
                            {columnVisibility.discount && (
                              <TableCell className="text-right">
                                {variant.discount ? `${variant.discount}%` : 'N/A'}
                              </TableCell>
                            )}
                            
                            {columnVisibility.color && (
                              <TableCell>{variant.color || 'N/A'}</TableCell>
                            )}
                            
                            {columnVisibility.size && (
                              <TableCell>{variant.size || 'N/A'}</TableCell>
                            )}
                            
                            {columnVisibility.currency && (
                              <TableCell>{variant.currency || 'N/A'}</TableCell>
                            )}
                            
                            <TableCell>
                              <div className="flex">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => window.open(variant.sourceUrl, '_blank')}
                                  disabled={!variant.sourceUrl}
                                  title="Visit source"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                {variant.hasPriceHistory && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShowPriceHistory(variant.id);
                                    }}
                                    title="Show price history"
                                  >
                                    <LineChart className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
              
              {/* Pagination */}
              {variants.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={filters.pageSize.toString()}
                      onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500">items per page</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={isLoading || currentPage === 0}
                      onClick={() => handlePageChange(0)}
                      size="sm"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isLoading || currentPage === 0}
                      onClick={() => handlePageChange(currentPage - 1)}
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="flex items-center mx-2 text-sm text-gray-500">
                      {currentPage + 1} / {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      disabled={isLoading || (currentPage >= totalPages - 1)}
                      onClick={() => handlePageChange(currentPage + 1)}
                      size="sm"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isLoading || (currentPage >= totalPages - 1)}
                      onClick={() => handlePageChange(totalPages - 1)}
                      size="sm"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      
      {/* Price History Dialog */}
      <Dialog open={priceHistoryDialogOpen} onOpenChange={setPriceHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Price History</DialogTitle>
          </DialogHeader>
          
          {isLoadingPriceHistory ? (
            <div className="flex justify-center items-center py-12">
              <RotateCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : priceHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No price history available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple price history visualization */}
              <div className="border rounded-md p-4">
                <div className="h-[250px] relative">
                  {/* Create a simple line chart */}
                  {(() => {
                    // Find min and max prices for scaling
                    const prices = priceHistory.map(item => item.price);
                    const maxPrice = Math.max(...prices);
                    const minPrice = Math.min(...prices);
                    const priceRange = (maxPrice - minPrice) * 1.2; // Add 20% padding
                    const adjustedMinPrice = Math.max(0, minPrice - priceRange * 0.1); // Ensure we don't go below 0
                    
                    // Find min and max price items
                    const minPriceItem = priceHistory.find(item => item.price === minPrice);
                    const maxPriceItem = priceHistory.find(item => item.price === maxPrice);
                    
                    // Sort by date ascending
                    const sortedHistory = [...priceHistory].sort(
                      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
                    );
                    
                    // Dates for X-axis
                    const firstDate = new Date(sortedHistory[0].recordedAt).getTime();
                    const lastDate = new Date(sortedHistory[sortedHistory.length - 1].recordedAt).getTime();
                    const dateRange = lastDate - firstDate;
                    
                    // Calculate date label positions
                    const dateLabels = [];
                    if (sortedHistory.length > 1) {
                      // Start date
                      dateLabels.push({
                        date: new Date(firstDate),
                        position: 0
                      });
                      
                      // Middle date
                      const middleDate = new Date(firstDate + dateRange / 2);
                      dateLabels.push({
                        date: middleDate,
                        position: 50
                      });
                      
                      // End date
                      dateLabels.push({
                        date: new Date(lastDate),
                        position: 100
                      });
                    }
                    
                    // Format date for labels
                    const formatDateLabel = (date: Date) => {
                      return date.toLocaleDateString();
                    };
                    
                    return (
                      <>
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500">
                          <div>{formatPrice(maxPrice + priceRange * 0.1)}</div>
                          <div>{formatPrice((maxPrice + adjustedMinPrice) / 2)}</div>
                          <div>{formatPrice(adjustedMinPrice)}</div>
                        </div>
                        
                        {/* Chart area */}
                        <div className="absolute left-16 right-0 top-0 bottom-0">
                          {/* Grid lines */}
                          <div className="absolute left-0 right-0 top-0 h-px bg-gray-200"></div>
                          <div className="absolute left-0 right-0 top-1/4 h-px bg-gray-200"></div>
                          <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-200"></div>
                          <div className="absolute left-0 right-0 top-3/4 h-px bg-gray-200"></div>
                          <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
                          
                          {/* Vertical grid lines */}
                          {dateLabels.map((label, i) => (
                            <div key={i} 
                              className="absolute top-0 bottom-0 w-px bg-gray-200"
                              style={{left: `${label.position}%`}}
                            ></div>
                          ))}
                          
                          {/* Data points and lines */}
                          {sortedHistory.map((item, index) => {
                            if (index === 0) return null; // Skip first point (we'll draw from second point)
                            
                            const prev = sortedHistory[index - 1];
                            const prevDate = new Date(prev.recordedAt).getTime();
                            const currDate = new Date(item.recordedAt).getTime();
                            
                            const prevX = ((prevDate - firstDate) / dateRange) * 100;
                            const currX = ((currDate - firstDate) / dateRange) * 100;
                            
                            const prevY = 100 - (((prev.price - adjustedMinPrice) / priceRange) * 100);
                            const currY = 100 - (((item.price - adjustedMinPrice) / priceRange) * 100);
                            
                            // Determine if price went up or down
                            const priceIncreased = item.price > prev.price;
                            const lineColor = priceIncreased ? "hsl(var(--destructive))" : "hsl(var(--success))";
                            
                            return (
                              <svg 
                                key={item.id} 
                                className="absolute left-0 top-0 w-full h-full overflow-visible"
                              >
                                {/* Price change line */}
                                <line
                                  x1={`${prevX}%`}
                                  y1={`${prevY}%`}
                                  x2={`${currX}%`}
                                  y2={`${currY}%`}
                                  stroke={lineColor}
                                  strokeWidth="2"
                                />
                                
                                {/* Regular point */}
                                <circle
                                  cx={`${currX}%`}
                                  cy={`${currY}%`}
                                  r="3"
                                  fill={lineColor}
                                />
                                
                                {/* Price change indicator (small arrow) */}
                                {Math.abs(item.price - prev.price) > (maxPrice - minPrice) * 0.05 && (
                                  <text
                                    x={`${currX}%`}
                                    y={`${currY - 5}%`}
                                    fontSize="10"
                                    textAnchor="middle"
                                    fill={lineColor}
                                  >
                                    {priceIncreased ? "▲" : "▼"}
                                  </text>
                                )}
                              </svg>
                            );
                          })}
                          
                          {/* Min price marker */}
                          {minPriceItem && (
                            <div 
                              className="absolute"
                              style={{
                                left: `${((new Date(minPriceItem.recordedAt).getTime() - firstDate) / dateRange) * 100}%`,
                                top: `${100 - (((minPriceItem.price - adjustedMinPrice) / priceRange) * 100)}%`,
                                transform: "translate(-50%, -100%)"
                              }}
                            >
                              <div className="bg-green-600 text-white px-2 py-0.5 rounded-md text-xs whitespace-nowrap">
                                Min: {formatPrice(minPriceItem.price)}
                              </div>
                              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-green-600 mx-auto" />
                            </div>
                          )}
                          
                          {/* Max price marker */}
                          {maxPriceItem && (
                            <div 
                              className="absolute"
                              style={{
                                left: `${((new Date(maxPriceItem.recordedAt).getTime() - firstDate) / dateRange) * 100}%`,
                                top: `${100 - (((maxPriceItem.price - adjustedMinPrice) / priceRange) * 100)}%`,
                                transform: "translate(-50%, -100%)"
                              }}
                            >
                              <div className="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs whitespace-nowrap">
                                Max: {formatPrice(maxPriceItem.price)}
                              </div>
                              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-red-600 mx-auto" />
                            </div>
                          )}
                        </div>
                        
                        {/* X-axis date labels */}
                        <div className="absolute left-16 right-0 top-full mt-1 flex justify-between text-xs text-gray-500">
                          {dateLabels.map((label, i) => (
                            <div key={i} style={{position: 'absolute', left: `${label.position}%`, transform: 'translateX(-50%)'}}>
                              {formatDateLabel(label.date)}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="flex justify-between items-center px-4">
                <div className="text-sm font-medium">Price Change Legend:</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-success mr-1"></div>
                    <span className="text-xs">Price Decrease</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-destructive mr-1"></div>
                    <span className="text-xs">Price Increase</span>
                  </div>
                </div>
              </div>
              
              {/* Price history table */}
              <div className="rounded-md border max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Old Price</TableHead>
                      <TableHead>Discount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...priceHistory]
                      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                      .map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                              {formatDate(item.recordedAt)}
                            </div>
                          </TableCell>
                          <TableCell>{formatPrice(item.price)}</TableCell>
                          <TableCell>{item.oldPrice ? formatPrice(item.oldPrice) : 'N/A'}</TableCell>
                          <TableCell>{item.discount ? `${item.discount}%` : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage; 