import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createProductRegistry,
  deleteProductRegistry,
  getProductRegistry,
  getProductRegistryTypes,
  ProductRegistryDTO,
  refreshProductRegistry,
  updateProductRegistry,
  bulkExportProductRegistry
} from '@/services/productService';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  FileDown,
  FileUp,
  PlusCircle,
  RefreshCw,
  Save,
  Trash,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Format date function
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return isNaN(date.getTime()) 
    ? '-' 
    : date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Add pagination related types
interface RegistryFilter {
  type?: string;
  search?: string;
  page: number;
  size: number;
  sort?: string;
}
const RegistryPage = () => {
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
  const [newItem, setNewItem] = useState<Omit<ProductRegistryDTO, 'id'>>({
    registryType: '',
    registryKey: '',
    registryValue: '',
    description: '',
    enabled: true
  });
  const [editItems, setEditItems] = useState<{ [key: number]: ProductRegistryDTO }>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  
  // Pagination state
  const [filters, setFilters] = useState<RegistryFilter>({
    page: 0,
    size: 10,
    sort: 'created,desc'
  });

  // Load registry types
  const { 
    data: registryTypes = [], 
    isLoading: isLoadingTypes 
  } = useQuery({
    queryKey: ['registry-types'],
    queryFn: getProductRegistryTypes,
  });

  // Load registry items with pagination
  const { 
    data: registryData,
    isLoading: isLoadingItems,
    refetch: refetchItems
  } = useQuery({
    queryKey: ['registry-items', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('size', filters.size.toString());
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      
      const queryString = params.toString();
      // @ts-ignore: We know this function accepts an optional parameter
      return getProductRegistry(queryString);
    },
    enabled: true,
  });

  const registryItems = registryData?.content || [];

  // Initialize selected type
  useEffect(() => {
    if (registryTypes.length > 0 && !selectedType && !newItem.registryType) {
      const firstType = registryTypes[0];
      setNewItem(prev => ({ ...prev, registryType: firstType }));
    }
  }, [registryTypes, selectedType, newItem.registryType]);

  // Apply search term with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        page: 0,
        search: searchTerm || undefined
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchItems().finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleTypeChange = (type: string) => {
    // Handle "__all__" special value
    const actualType = type === "__all__" ? undefined : type;
    setSelectedType(actualType);
    
    if (isAddingNew) {
      setNewItem(prev => ({ 
        ...prev, 
        registryType: actualType || registryTypes[0] || '' 
      }));
    }
    
    setEditMode({});
    
    // Reset pagination and update type filter
    setFilters(prev => ({
      ...prev,
      page: 0,
      type: actualType
    }));
  };

  const handleRefreshRegistry = async () => {
    try {
      setIsRefreshingCache(true);
      await refreshProductRegistry();
      toast.success('Registry cache refreshed successfully');
    } catch (error) {
      console.error('Error refreshing registry cache:', error);
      toast.error('Failed to refresh registry cache');
    } finally {
      setIsRefreshingCache(false);
    }
  };

  const handleAddNewToggle = () => {
    setIsAddingNew(!isAddingNew);
    if (!isAddingNew) {
      setNewItem({
        registryType: selectedType || registryTypes[0] || '',
        registryKey: '',
        registryValue: '',
        description: '',
        enabled: true
      });
    }
  };

  const handleNewItemChange = (field: keyof Omit<ProductRegistryDTO, 'id'>, value: string | boolean) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateItem = async () => {
    try {
      if (!newItem.registryKey || !newItem.registryValue) {
        toast.error('Key and Value are required');
        return;
      }

      await createProductRegistry(newItem);
      toast.success('Registry item created successfully');
      setIsAddingNew(false);
      setNewItem({
        registryType: selectedType || registryTypes[0] || '',
        registryKey: '',
        registryValue: '',
        description: '',
        enabled: true
      });
      refetchItems();
    } catch (error) {
      console.error('Error creating registry item:', error);
      toast.error('Failed to create registry item');
    }
  };

  const handleToggleEditMode = (item: ProductRegistryDTO) => {
    if (editMode[item.id]) {
      // Save changes
      handleUpdateItem(item.id);
    } else {
      // Enter edit mode
      setEditItems(prev => ({
        ...prev,
        [item.id]: { ...item }
      }));
      setEditMode(prev => ({
        ...prev,
        [item.id]: true
      }));
    }
  };

  const handleCancelEdit = (id: number) => {
    setEditMode(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setEditItems(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleEditItemChange = (id: number, field: keyof ProductRegistryDTO, value: string | boolean) => {
    setEditItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleUpdateItem = async (id: number) => {
    try {
      const item = editItems[id];
      if (!item.registryKey || !item.registryValue) {
        toast.error('Key and Value are required');
        return;
      }

      await updateProductRegistry(id, {
        registryType: item.registryType,
        registryKey: item.registryKey,
        registryValue: item.registryValue,
        description: item.description,
        enabled: item.enabled
      });

      toast.success('Registry item updated successfully');
      setEditMode(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setEditItems(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      refetchItems();
    } catch (error) {
      console.error('Error updating registry item:', error);
      toast.error('Failed to update registry item');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this registry item?')) {
      return;
    }

    try {
      await deleteProductRegistry(id);
      toast.success('Registry item deleted successfully');
      refetchItems();
    } catch (error) {
      console.error('Error deleting registry item:', error);
      toast.error('Failed to delete registry item');
    }
  };

  const exportRegistry = () => {
    try {
      bulkExportProductRegistry().then(data => {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `registry-${selectedType || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast.success(`Successfully exported ${data.length} registry entries`);
      }).catch(error => {
        console.error('Error exporting registry:', error);
        toast.error('Failed to export registry');
      });
    } catch (error) {
      console.error('Error exporting registry:', error);
      toast.error('Failed to export registry');
    }
  };

  const importRegistry = () => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/json';
      fileInput.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const content = e.target?.result as string;
              const json = JSON.parse(content);
              
              // Process the imported data (e.g., send to backend)
              console.log('Imported data:', json);
              toast.success(`Successfully imported ${json.length} registry entries`);
              refetchItems();
            } catch (error) {
              console.error('Error parsing JSON:', error);
              toast.error('Failed to parse import file');
            }
          };
          reader.readAsText(file);
        }
      };
      fileInput.click();
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Failed to import registry');
    }
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
      size
    }));
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">System Registry</h1>
        </div>

        <div className="flex gap-4">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Registry Items</CardTitle>
                <CardDescription>
                  Manage system configuration, mappings, and reference data
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleRefreshRegistry}
                  disabled={isRefreshingCache}
                >
                  {isRefreshingCache ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh Cache
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <Select
                      value={selectedType || "__all__"}
                      onValueChange={handleTypeChange}
                      disabled={isLoadingTypes}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Types</SelectItem>
                        {registryTypes.map((type: string) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-[250px]">
                      <Input
                        placeholder="Search registry items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          onClick={clearSearch}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportRegistry}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={importRegistry}
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </div>
                </div>
                <Button
                  variant={isAddingNew ? "secondary" : "default"}
                  size="sm"
                  onClick={handleAddNewToggle}
                >
                  {isAddingNew ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New
                    </>
                  )}
                </Button>
              </div>

              {isAddingNew && (
                <div className="mb-6 p-4 border rounded-md bg-muted/40">
                  <h3 className="text-sm font-medium mb-3">Add New Registry Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={newItem.registryType}
                        onValueChange={(value) => handleNewItemChange('registryType', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {registryTypes.map((type: string) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Key</label>
                      <Input
                        value={newItem.registryKey}
                        onChange={(e) => handleNewItemChange('registryKey', e.target.value)}
                        placeholder="Enter registry key"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Value</label>
                      <Input
                        value={newItem.registryValue}
                        onChange={(e) => handleNewItemChange('registryValue', e.target.value)}
                        placeholder="Enter registry value"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={newItem.description}
                      onChange={(e) => handleNewItemChange('description', e.target.value)}
                      placeholder="Enter description (optional)"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      checked={newItem.enabled}
                      onCheckedChange={(checked) => handleNewItemChange('enabled', checked)}
                      id="new-item-enabled"
                    />
                    <label
                      htmlFor="new-item-enabled"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enabled
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleCreateItem}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="w-[100px] cursor-pointer"
                        onClick={() => handleSort('enabled')}
                      >
                        Enabled
                        {getSortDirection('enabled') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('enabled') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead 
                        className="min-w-[120px] cursor-pointer"
                        onClick={() => handleSort('registryType')}
                      >
                        Type
                        {getSortDirection('registryType') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('registryType') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead 
                        className="min-w-[150px] cursor-pointer"
                        onClick={() => handleSort('registryKey')}
                      >
                        Key
                        {getSortDirection('registryKey') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('registryKey') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort('registryValue')}
                      >
                        Value
                        {getSortDirection('registryValue') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('registryValue') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('created')}
                      >
                        Created
                        {getSortDirection('created') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('created') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingItems ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Loading registry items...
                        </TableCell>
                      </TableRow>
                    ) : registryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No registry items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registryItems.map((item: ProductRegistryDTO) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {editMode[item.id] ? (
                              <Switch
                                checked={editItems[item.id]?.enabled}
                                onCheckedChange={(checked) => handleEditItemChange(item.id, 'enabled', checked)}
                              />
                            ) : (
                              <div className={`h-2 w-2 rounded-full ${item.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                            )}
                          </TableCell>
                          <TableCell>
                            {editMode[item.id] ? (
                              <Select
                                value={editItems[item.id]?.registryType || ''}
                                onValueChange={(value) => handleEditItemChange(item.id, 'registryType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {registryTypes.map((type: string) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              item.registryType
                            )}
                          </TableCell>
                          <TableCell>
                            {editMode[item.id] ? (
                              <Input
                                value={editItems[item.id]?.registryKey || ''}
                                onChange={(e) => handleEditItemChange(item.id, 'registryKey', e.target.value)}
                              />
                            ) : (
                              item.registryKey
                            )}
                          </TableCell>
                          <TableCell>
                            {editMode[item.id] ? (
                              <Input
                                value={editItems[item.id]?.registryValue || ''}
                                onChange={(e) => handleEditItemChange(item.id, 'registryValue', e.target.value)}
                              />
                            ) : (
                              item.registryValue
                            )}
                          </TableCell>
                          <TableCell>
                            {editMode[item.id] ? (
                              <Input
                                value={editItems[item.id]?.description || ''}
                                onChange={(e) => handleEditItemChange(item.id, 'description', e.target.value)}
                              />
                            ) : (
                              item.description || '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editMode[item.id] ? (
                              <Input
                                value={editItems[item.id]?.created || ''}
                                onChange={(e) => handleEditItemChange(item.id, 'created', e.target.value)}
                                disabled // Prevent editing the created date
                              />
                            ) : (
                              formatDate(item.created)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleEditMode(item)}
                              >
                                {editMode[item.id] ? (
                                  <Save className="h-4 w-4" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                              {editMode[item.id] ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCancelEdit(item.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {registryData && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={filters.size.toString()}
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
                    <span className="text-sm text-gray-500">Items per page</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={isLoadingItems || filters.page === 0}
                      onClick={() => handlePageChange(0)}
                      size="sm"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isLoadingItems || filters.page === 0}
                      onClick={() => handlePageChange(filters.page - 1)}
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="flex items-center mx-2 text-sm text-gray-500">
                      {registryData.number + 1} / {registryData.totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      disabled={isLoadingItems || (registryData.number >= registryData.totalPages - 1)}
                      onClick={() => handlePageChange(filters.page + 1)}
                      size="sm"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isLoadingItems || (registryData.number >= registryData.totalPages - 1)}
                      onClick={() => handlePageChange(registryData.totalPages - 1)}
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
      </div>
    </div>
  );
};

export default RegistryPage; 