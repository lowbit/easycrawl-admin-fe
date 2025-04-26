import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  getProductBrands,
  getProductCategories,
  getProducts,
  ProductCategoryDTO,
  ProductDTO,
  ProductSearchParams,
  triggerProductCleanup,
  triggerProductProcessing,
  runProductCleanup,
  updateProductNames,
  mergeDuplicates
} from '@/services/productService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  GitMerge,
  LayoutGrid,
  Loader2,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  Sparkles,
  Type
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ProductsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialLoad = useRef(true);
  const [searchParams, setSearchParams] = useState<ProductSearchParams>({
    name: '',
    brand: '',
    category: '',
    page: 0,
    size: 10,
    sort: 'id,desc'
  });
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    name: true,
    brand: true,
    category: true,
    lowestPrice: true,
    highestPrice: true,
    storeCount: true,
    actions: true,
  });
  
  // Cleanup state variables
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [isUpdatingNames, setIsUpdatingNames] = useState(false);
  const [isMergingDuplicates, setIsMergingDuplicates] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<any>(null);

  // Prepare API parameters without empty brand and category
  const getApiParams = () => {
    const apiParams = { ...searchParams };
    if (!apiParams.brand) delete apiParams.brand;
    if (!apiParams.category) delete apiParams.category;
    return apiParams;
  };

  // Load products
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['products', searchParams],
    queryFn: () => getProducts(getApiParams()),
  });

  // Load brands for filtering
  const {
    data: brands = [],
  } = useQuery({
    queryKey: ['product-brands'],
    queryFn: getProductBrands,
  });

  // Load categories for filtering
  const {
    data: categories = [],
  } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories,
  });

  const handleNameFilterChange = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      name: value,
      page: 0, // Reset to first page when filter changes
    }));
  };

  const handleBrandFilterChange = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      brand: value === 'all' ? '' : value,
      page: 0,
    }));
  };

  const handleCategoryFilterChange = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      category: value === 'all' ? '' : value,
      page: 0,
    }));
  };

  const handleResetFilters = () => {
    setSearchParams(prev => ({
      ...prev,
      name: '',
      brand: '',
      category: '',
      page: 0,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleViewProduct = (id: number) => {
    navigate(`/products/${id}`);
  };

  const handleTriggerProcessing = async () => {
    try {
      await triggerProductProcessing();
      toast.success('Product processing job started successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      console.error('Error triggering product processing:', error);
      toast.error('Failed to start product processing job');
    }
  };

  const handleTriggerCleanup = async () => {
    try {
      await triggerProductCleanup('all');
      toast.success('Product cleanup job started successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      console.error('Error triggering product cleanup:', error);
      toast.error('Failed to start product cleanup job');
    }
  };

  // Cleanup handlers
  const handleRunCleanup = async () => {
    setIsRunningCleanup(true);
    setCleanupResults(null);
    try {
      const data = await runProductCleanup();
      setCleanupResults(data);
      toast.success('Product cleanup completed successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error running product cleanup:', error);
      toast.error('Failed to run product cleanup');
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const handleUpdateNames = async () => {
    setIsUpdatingNames(true);
    setCleanupResults(null);
    try {
      const data = await updateProductNames();
      setCleanupResults(data);
      toast.success('Product names updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error updating product names:', error);
      toast.error('Failed to update product names');
    } finally {
      setIsUpdatingNames(false);
    }
  };

  const handleMergeDuplicates = async () => {
    setIsMergingDuplicates(true);
    setCleanupResults(null);
    try {
      const data = await mergeDuplicates();
      setCleanupResults(data);
      toast.success('Duplicate products merged successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error merging duplicate products:', error);
      toast.error('Failed to merge duplicate products');
    } finally {
      setIsMergingDuplicates(false);
    }
  };

  // Format cleanup results for display
  const formatResults = (results: any) => {
    if (!results) return null;

    return (
      <div className="mt-4 space-y-4">
        <h3 className="text-lg font-medium">Operation Results:</h3>
        <div className="space-y-2">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b pb-2">
              <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSort = (column: string) => {
    const currentSort = searchParams.sort || '';
    const [currentColumn, currentDirection] = currentSort.split(',');

    const newDirection = currentColumn === column && currentDirection === 'asc' ? 'desc' : 'asc';
    setSearchParams(prev => ({
      ...prev,
      sort: `${column},${newDirection}`,
      page: 0
    }));
  };

  const getSortDirection = (column: string) => {
    const currentSort = searchParams.sort || '';
    const [currentColumn, direction] = currentSort.split(',');
    return currentColumn === column ? direction : undefined;
  };

  // Initialize filters with URL params
  useEffect(() => {
    if (!initialLoad.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name') || '';
    const brandParam = params.get('brand') || '';
    const categoryParam = params.get('category') || '';
    const pageParam = parseInt(params.get('page') || '0', 10);
    const sizeParam = parseInt(params.get('size') || '10', 10);
    const sortParam = params.get('sort') || 'id,desc';

    setSearchParams({
      name: nameParam,
      brand: brandParam,
      category: categoryParam,
      page: pageParam,
      size: sizeParam,
      sort: sortParam,
    });
    
    initialLoad.current = false;
  }, []);

  // Update URL when search params change
  useEffect(() => {
    if (initialLoad.current) return;
    
    const params = new URLSearchParams();
    if (searchParams.name) params.append('name', searchParams.name);
    if (searchParams.brand && searchParams.brand !== '') params.append('brand', searchParams.brand);
    if (searchParams.category && searchParams.category !== '') params.append('category', searchParams.category);
    if (searchParams.page > 0) params.append('page', searchParams.page.toString());
    if (searchParams.size !== 10) params.append('size', searchParams.size.toString());
    if (searchParams.sort && searchParams.sort !== 'id,desc') params.append('sort', searchParams.sort);

    const newUrl =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : '');

    window.history.pushState({}, '', newUrl);
  }, [searchParams]);

  // Format price to display with currency
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'BAM',
      minimumFractionDigits: 0,
    }).format(price).replace('BAM', 'KM');
  };

  // Render table content based on loading state and data
  const renderTableContent = () => {
    if (isLoadingProducts) {
      return (
        <TableRow>
          <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center">
            Loading products...
          </TableCell>
        </TableRow>
      );
    }

    if (!productsData?.content?.length) {
      return (
        <TableRow>
          <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center">
            No products found.
          </TableCell>
        </TableRow>
      );
    }

    return productsData.content.map((product: ProductDTO) => (
      <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewProduct(product.id)}>
        {columnVisibility.id && (
          <TableCell>{product.id}</TableCell>
        )}
        {columnVisibility.name && (
          <TableCell>
            <div className="flex items-center gap-3">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-8 w-8 rounded-md object-cover"
                />
              )}
              <span className="font-medium">{product.name}</span>
            </div>
          </TableCell>
        )}
        {columnVisibility.brand && (
          <TableCell>{product.brand}</TableCell>
        )}
        {columnVisibility.category && (
          <TableCell>{product.category}</TableCell>
        )}
        {columnVisibility.lowestPrice && (
          <TableCell className="text-right">{formatPrice(product.lowestPrice)}</TableCell>
        )}
        {columnVisibility.highestPrice && (
          <TableCell className="text-right">{formatPrice(product.highestPrice)}</TableCell>
        )}
        {columnVisibility.storeCount && (
          <TableCell className="text-center">{product.storeCount}</TableCell>
        )}
        {columnVisibility.actions && (
          <TableCell onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleTriggerProcessing}
              >
                <Play className="mr-2 h-4 w-4" />
                Process Products
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCleanupPanel(!showCleanupPanel)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {showCleanupPanel ? 'Hide Cleanup Tools' : 'Cleanup Tools'}
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(columnVisibility).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked: boolean) => {
                        setColumnVisibility((prev) => ({ ...prev, [key]: checked }));
                      }}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchParams({
                    name: '',
                    brand: '',
                    category: '',
                    page: 0,
                    size: 10,
                    sort: 'id,desc'
                  });
                  setTimeout(() => refetchProducts(), 0);
                }}
                disabled={isLoadingProducts}
              >
                {isLoadingProducts ? (
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="mr-2 h-4 w-4" />
                )}
                Reset & Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showCleanupPanel && (
            <div className="mb-6">
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Run Full Cleanup</CardTitle>
                    <CardDescription>
                      Run a full product cleanup to standardize names and merge duplicates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      This operation will update product names based on registry rules and then merge duplicates.
                      This might take a while depending on the number of products.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        onClick={handleRunCleanup}
                        disabled={isRunningCleanup}
                      >
                        {isRunningCleanup ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Run Full Cleanup
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleTriggerCleanup}
                      >
                        Schedule Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Individual Operations</CardTitle>
                    <CardDescription>
                      Run name standardization or duplicate merging separately
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Update product names according to the naming standards in the registry.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleUpdateNames}
                        disabled={isUpdatingNames}
                      >
                        {isUpdatingNames ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Type className="mr-2 h-4 w-4" />
                        )}
                        Update Names Only
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Find and merge duplicate products based on similarity.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleMergeDuplicates}
                        disabled={isMergingDuplicates}
                      >
                        {isMergingDuplicates ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <GitMerge className="mr-2 h-4 w-4" />
                        )}
                        Merge Duplicates Only
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {cleanupResults && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Operation Results</CardTitle>
                    <CardDescription>
                      Summary of the last cleanup operation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formatResults(cleanupResults)}
                  </CardContent>
                </Card>
              )}

              <Separator className="my-6" />
            </div>
          )}

          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-4">
              <Input
                placeholder="Search by name..."
                value={searchParams.name}
                onChange={(e) => handleNameFilterChange(e.target.value)}
              />
            </div>
            <div className="col-span-4">
              <Select
                value={searchParams.brand || 'all'}
                onValueChange={handleBrandFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand: string) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Select
                value={searchParams.category || 'all'}
                onValueChange={handleCategoryFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: ProductCategoryDTO) => (
                    <SelectItem key={category.code} value={category.code}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnVisibility.id && (
                    <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort('id')}>
                      ID {getSortDirection('id') === 'asc' ? '↑' : getSortDirection('id') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.name && (
                    <TableHead className="min-w-[150px] cursor-pointer" onClick={() => handleSort('name')}>
                      Name {getSortDirection('name') === 'asc' ? '↑' : getSortDirection('name') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.brand && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('brand')}>
                      Brand {getSortDirection('brand') === 'asc' ? '↑' : getSortDirection('brand') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.category && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                      Category {getSortDirection('category') === 'asc' ? '↑' : getSortDirection('category') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.lowestPrice && (
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('lowestPrice')}>
                      Lowest Price {getSortDirection('lowestPrice') === 'asc' ? '↑' : getSortDirection('lowestPrice') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.highestPrice && (
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('highestPrice')}>
                      Highest Price {getSortDirection('highestPrice') === 'asc' ? '↑' : getSortDirection('highestPrice') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.storeCount && (
                    <TableHead className="text-center cursor-pointer" onClick={() => handleSort('storeCount')}>
                      Store Count {getSortDirection('storeCount') === 'asc' ? '↑' : getSortDirection('storeCount') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.actions && (
                    <TableHead className="w-[80px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableContent()}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Select
                value={searchParams.size?.toString() || '10'}
                onValueChange={(value: string) => setSearchParams(prev => ({ ...prev, size: parseInt(value), page: 0 }))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">Items per page</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={isLoadingProducts || !productsData || searchParams.page === 0}
                onClick={() => handlePageChange(0)}
                size="sm"
              >
                First
              </Button>
              <Button
                variant="outline"
                disabled={isLoadingProducts || !productsData || searchParams.page === 0}
                onClick={() => handlePageChange(searchParams.page - 1)}
                size="sm"
              >
                Previous
              </Button>
              {productsData && (
                <span className="flex items-center mx-2 text-sm text-gray-500">
                  {(productsData.number || 0) + 1} / {productsData.totalPages || 1}
                </span>
              )}
              <Button
                variant="outline"
                disabled={isLoadingProducts || !productsData || (productsData.number || 0) >= (productsData?.totalPages || 0) - 1}
                onClick={() => handlePageChange(searchParams.page + 1)}
                size="sm"
              >
                Next
              </Button>
              <Button
                variant="outline"
                disabled={isLoadingProducts || !productsData || (productsData.number || 0) >= (productsData?.totalPages || 0) - 1}
                onClick={() => handlePageChange((productsData?.totalPages || 1) - 1)}
                size="sm"
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage; 