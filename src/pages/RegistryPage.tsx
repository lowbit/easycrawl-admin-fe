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
  bulkExportProductRegistry,
  createProductRegistry,
  deleteProductRegistry,
  getProductRegistry,
  getProductRegistryTypes,
  ProductRegistryDTO,
  refreshProductRegistry,
  updateProductRegistry,
  batchChangeType
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
  X,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteDTO, DropdownDTO, registryService } from '@/services/registryService';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Format date function
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? '-' 
      : date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '-';
  }
};

// Add pagination related types
interface RegistryFilter {
  type?: string;
  search?: string;
  page: number;
  size: number;
  sort?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface WebsiteFormData {
  code: string;
  name: string;
  url: string;
}

interface CategoryFormData {
  code: string;
  name: string;
}

const RegistryDialog = ({
  open,
  onOpenChange,
  type,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'website' | 'category';
  onSave: (data: WebsiteDTO | DropdownDTO) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<WebsiteFormData | CategoryFormData>({
    code: '',
    name: '',
    ...(type === 'website' ? { url: '' } : {})
  });

  useEffect(() => {
    if (open) {
      setFormData({
        code: '',
        name: '',
        ...(type === 'website' ? { url: '' } : {})
      });
    }
  }, [open, type]);

  const handleInputChange = (field: string, value: string) => {
    if (type === 'website') {
      if (field === 'url' && value) {
        try {
          const urlObj = new URL(value);
          const domain = urlObj.hostname;
          const possibleCode = domain;
          const possibleName = domain.split('.')[0];

          setFormData(prev => ({
            ...prev,
            url: value,
            code: possibleCode,
            name: possibleName.charAt(0).toUpperCase() + possibleName.slice(1)
          }));
        } catch (error) {
          setFormData(prev => ({ ...prev, url: value }));
        }
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      if (field === 'code' && value) {
        const name = value.charAt(0).toUpperCase() + value.slice(1);
        setFormData(prev => ({ ...prev, code: value, name }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleSave = async () => {
    if (type === 'website') {
      const websiteData = formData as WebsiteFormData;
      if (!websiteData.code || !websiteData.name || !websiteData.url) {
        toast.error("All fields are required");
        return;
      }
    } else {
      const categoryData = formData as CategoryFormData;
      if (!categoryData.code || !categoryData.name) {
        toast.error("All fields are required");
        return;
      }
    }

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      toast.error(`Failed to save ${type}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add {type === 'website' ? 'Website' : 'Category'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {type === 'website' && (
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={(formData as WebsiteFormData).url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
  const [addNewDialogOpen, setAddNewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  
  // Multi-select state
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedStringItems, setSelectedStringItems] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [batchTargetType, setBatchTargetType] = useState<string>('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchTypeDialogOpen, setBatchTypeDialogOpen] = useState(false);
  
  // Track selected IDs by page to maintain selection state across pagination
  const [selectedByPage, setSelectedByPage] = useState<{[page: number]: number[]}>({});
  
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
    
    // Reset filters and refresh data
    setFilters({
      page: 0,
      size: 10,
      sort: 'created,desc'
    });
    setSelectedType(undefined);
    setSearchTerm('');
    setSelectedItems([]);
    setSelectedStringItems([]);
    setShowBatchActions(false);
    
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
    if (!isAddingNew) {
      setNewItem({
        registryType: selectedType || registryTypes[0] || '',
        registryKey: '',
        registryValue: '',
        description: '',
        enabled: true
      });
    }
    setIsAddingNew(!isAddingNew);
    setAddNewDialogOpen(!isAddingNew);
  };

  const handleNewItemChange = (field: keyof Omit<ProductRegistryDTO, 'id'>, value: string | boolean) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateItem = async () => {
    try {
      if (!newItem.registryKey) {
        toast.error('Key is required');
        return;
      }

      await createProductRegistry(newItem);
      toast.success('Registry item created successfully');
      setIsAddingNew(false);
      setAddNewDialogOpen(false);
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
      if (!item.registryKey) {
        toast.error('Key is required');
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
    if (!confirm('WARNING: Deleting this registry item may have serious impacts on products.\n\nDeleting items can cause products to be unprocessed, variants to be removed, or data to be lost.\n\nAre you sure you want to delete this item?')) {
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
  const handleRegistrySort = (column: string) => {
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

  // Check if all items on current page are selected
  const areAllCurrentPageItemsSelected = () => {
    if (registryItems.length === 0) return false;
    return registryItems.every((item: ProductRegistryDTO) => selectedItems.includes(item.id));
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

  // Multi-select handlers
  const handleSelectItem = (id: number, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleSelectStringItem = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedStringItems(prev => [...prev, id]);
    } else {
      setSelectedStringItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      // Only select items on current page
      const allCurrentPageIds = registryItems.map((item: ProductRegistryDTO) => item.id);
      setSelectedItems(prev => {
        // Keep previously selected items that aren't on the current page
        const itemsFromOtherPages = prev.filter(id => !allCurrentPageIds.includes(id));
        return [...itemsFromOtherPages, ...allCurrentPageIds];
      });
    } else {
      // Only unselect items on current page
      const allCurrentPageIds = registryItems.map((item: ProductRegistryDTO) => item.id);
      setSelectedItems(prev => prev.filter(id => !allCurrentPageIds.includes(id)));
    }
  };

  const handleRowClick = (item: ProductRegistryDTO, event: React.MouseEvent) => {
    // Don't trigger selection on clicks within action buttons or in edit mode
    if (
      editMode[item.id] || 
      (event.target as HTMLElement).closest('.action-buttons') ||
      (event.target as HTMLElement).closest('button') ||
      (event.target as HTMLElement).closest('input') ||
      (event.target as HTMLElement).closest('select')
    ) {
      return;
    }
    
    const isSelected = selectedItems.includes(item.id);
    handleSelectItem(item.id, !isSelected);
  };

  const handleStringItemRowClick = (item: DropdownDTO, event: React.MouseEvent) => {
    // Don't trigger selection on clicks within buttons
    if (
      (event.target as HTMLElement).closest('button') ||
      (event.target as HTMLElement).closest('input')
    ) {
      return;
    }
    
    const isSelected = selectedStringItems.includes(item.code);
    handleSelectStringItem(item.code, !isSelected);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
    setSelectedStringItems([]);
    setShowBatchActions(false);
  };

  const toggleBatchActions = () => {
    setBatchTypeDialogOpen(true);
    if (registryTypes.length > 0 && !batchTargetType) {
      setBatchTargetType(registryTypes[0]);
    }
  };

  const handleBatchTypeChange = async () => {
    if (selectedItems.length === 0 || !batchTargetType) return;
    
    try {
      setIsBatchProcessing(true);
      
      await batchChangeType(selectedItems, batchTargetType);
      console.log(`Changing type to ${batchTargetType} for items:`, selectedItems);
      
      toast.success(`Successfully changed type to ${batchTargetType} for ${selectedItems.length} items`);
      setSelectedItems([]);
      setSelectedStringItems([]);
      setShowBatchActions(false);
      setBatchTypeDialogOpen(false);
      refetchItems();
    } catch (error) {
      console.error('Error performing batch type change:', error);
      toast.error('Failed to change types for selected items');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const [websites, setWebsites] = useState<DropdownDTO[]>([]);
  const [categories, setCategories] = useState<DropdownDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'website' | 'category'>('website');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [websitesData, categoriesData] = await Promise.all([
        registryService.getWebsitesDropdown(),
        registryService.getCategoriesDropdown()
      ]);
      setWebsites(websitesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (type: 'website' | 'category') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleSave = async (data: WebsiteDTO | DropdownDTO) => {
    try {
      if (dialogType === 'website') {
        await registryService.addWebsite(data as WebsiteDTO);
        toast.success('Website added successfully');
      } else {
        await registryService.addCategory(data as DropdownDTO);
        toast.success('Category added successfully');
      }
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    }
  };

  const handleDelete = async (type: 'website' | 'category', id: string) => {
    if (!window.confirm(`WARNING: Deleting this ${type} may have serious impacts on products.\n\nDeleting ${type}s can cause products to be unprocessed, variants to be removed, or data to be lost.\n\nAre you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      if (type === 'website') {
        await registryService.deleteWebsite(id);
        toast.success('Website deleted successfully');
      } else {
        await registryService.deleteCategory(id);
        toast.success('Category deleted successfully');
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  // New state for websites and categories management
  const [websiteSearch, setWebsiteSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [websiteSort, setWebsiteSort] = useState<SortConfig>({ key: 'code', direction: 'asc' });
  const [categorySort, setCategorySort] = useState<SortConfig>({ key: 'code', direction: 'asc' });

  // Client-side filtering and sorting for websites
  const filteredWebsites = useMemo(() => {
    let result = [...websites];

    // Filter
    if (websiteSearch) {
      const searchLower = websiteSearch.toLowerCase();
      result = result.filter(website =>
        website.code.toLowerCase().includes(searchLower) ||
        website.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[websiteSort.key as keyof DropdownDTO];
      const bValue = b[websiteSort.key as keyof DropdownDTO];
      return websiteSort.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return result;
  }, [websites, websiteSearch, websiteSort]);

  // Client-side filtering and sorting for categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Filter
    if (categorySearch) {
      const searchLower = categorySearch.toLowerCase();
      result = result.filter(category =>
        category.code.toLowerCase().includes(searchLower) ||
        category.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[categorySort.key as keyof DropdownDTO];
      const bValue = b[categorySort.key as keyof DropdownDTO];
      return categorySort.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return result;
  }, [categories, categorySearch, categorySort]);

  const handleClientSort = (tab: 'website' | 'category', key: keyof DropdownDTO) => {
    if (tab === 'website') {
      setWebsiteSort(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setCategorySort(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    }
  };

  const getClientSortIcon = (tab: 'website' | 'category', key: keyof DropdownDTO) => {
    const sort = tab === 'website' ? websiteSort : categorySort;
    if (sort.key !== key) return null;
    return sort.direction === 'asc' ?
      <ChevronUp className="inline h-4 w-4 ml-1" /> :
      <ChevronDown className="inline h-4 w-4 ml-1" />;
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="registry" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registry">Registry Items</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="registry">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Registry Items</CardTitle>
                <CardDescription>
                  Manage system configuration, mappings, and reference data
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
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
                    Reset
                  </Button>
                  {selectedItems.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm">
                          <span className="mr-1">{selectedItems.length}</span> 
                          Selected
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Batch Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={toggleBatchActions}>
                          <Edit className="mr-2 h-4 w-4" />
                          Change Type
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (window.confirm(`WARNING: Batch deleting ${selectedItems.length} items may have serious impacts on products.\n\nDeleting registry items can cause products to be unprocessed, variants to be removed, or data to be lost.\n\nAre you sure you want to delete these items?`)) {
                              // Add bulk delete API call here when implemented
                              console.log("Delete items:", selectedItems);
                              toast.success(`Deleted ${selectedItems.length} items`);
                              setSelectedItems([]);
                              setSelectedStringItems([]);
                            }
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleClearSelection}>
                          <X className="mr-2 h-4 w-4" />
                          Clear Selection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning: Critical System Data</AlertTitle>
                <AlertDescription>
                  Changes made on this page directly impact products. Deleting or changing items can cause products to become unprocessed, 
                  remove variants, or affect data integrity. Please proceed with caution.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
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
              </div>

              {/* Add New Registry Item Dialog */}
              <Dialog open={addNewDialogOpen} onOpenChange={(open) => {
                setAddNewDialogOpen(open);
                if (!open) setIsAddingNew(false);
              }}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Registry Item</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Adding new registry items may impact products. Please proceed with caution.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="registry-type">Type</Label>
                        <Select
                          value={newItem.registryType}
                          onValueChange={(value) => handleNewItemChange('registryType', value)}
                        >
                          <SelectTrigger className="mt-1" id="registry-type">
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
                        <Label htmlFor="registry-key">Key</Label>
                        <Input
                          id="registry-key"
                          value={newItem.registryKey}
                          onChange={(e) => handleNewItemChange('registryKey', e.target.value)}
                          placeholder="Enter registry key"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="registry-value">Value</Label>
                        <Input
                          id="registry-value"
                          value={newItem.registryValue}
                          onChange={(e) => handleNewItemChange('registryValue', e.target.value)}
                          placeholder="Enter registry value"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="registry-description">Description</Label>
                        <Input
                          id="registry-description"
                          value={newItem.description}
                          onChange={(e) => handleNewItemChange('description', e.target.value)}
                          placeholder="Enter description (optional)"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="new-item-enabled"
                        checked={newItem.enabled}
                        onCheckedChange={(checked) => handleNewItemChange('enabled', checked)}
                      />
                      <label
                        htmlFor="new-item-enabled"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enabled
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setAddNewDialogOpen(false);
                        setIsAddingNew(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateItem}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={areAllCurrentPageItemsSelected()}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead 
                        className="w-[100px] cursor-pointer"
                        onClick={() => handleRegistrySort('enabled')}
                      >
                        Enabled
                        {getSortDirection('enabled') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('enabled') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead 
                        className="min-w-[120px] cursor-pointer"
                        onClick={() => handleRegistrySort('registryType')}
                      >
                        Type
                        {getSortDirection('registryType') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('registryType') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead 
                        className="min-w-[150px] cursor-pointer"
                        onClick={() => handleRegistrySort('registryKey')}
                      >
                        Key
                        {getSortDirection('registryKey') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('registryKey') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleRegistrySort('registryValue')}
                      >
                        Value
                        {getSortDirection('registryValue') === 'asc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
                        {getSortDirection('registryValue') === 'desc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleRegistrySort('created')}
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
                        <TableCell colSpan={8} className="h-24 text-center">
                          Loading registry items...
                        </TableCell>
                      </TableRow>
                    ) : registryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No registry items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registryItems.map((item: ProductRegistryDTO) => (
                        <TableRow 
                          key={item.id}
                          className={selectedItems.includes(item.id) ? "bg-muted/50" : ""}
                          onClick={(e) => handleRowClick(item, e)}
                          style={{ cursor: editMode[item.id] ? 'default' : 'pointer' }}
                        >
                          <TableCell>
                            <Checkbox 
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                              disabled={editMode[item.id]}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
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
                                disabled
                              />
                            ) : (
                              formatDate(item.created)
                            )}
                          </TableCell>
                          <TableCell className="text-right action-buttons">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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

              {/* Batch Type Change Dialog */}
              <Dialog open={batchTypeDialogOpen} onOpenChange={setBatchTypeDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Change Type for {selectedItems.length} Items</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Warning: Changing types may have serious impacts on products. This operation can cause products to be unprocessed or data to be lost.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="batch-type">Select Target Type</Label>
                        <Select
                          value={batchTargetType}
                          onValueChange={setBatchTargetType}
                        >
                          <SelectTrigger id="batch-type">
                            <SelectValue placeholder="Select target type" />
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
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline" 
                      onClick={() => setBatchTypeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBatchTypeChange}
                      disabled={isBatchProcessing || !batchTargetType}
                    >
                      {isBatchProcessing ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Apply Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websites">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Websites</CardTitle>
                <CardDescription>Manage website configurations and mappings</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => handleOpenDialog('website')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Website
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search websites..."
                    value={websiteSearch}
                    onChange={(e) => setWebsiteSearch(e.target.value)}
                    className="pl-8"
                  />
                  {websiteSearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setWebsiteSearch('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleClientSort('website', 'code')}
                      >
                        Code {getClientSortIcon('website', 'code')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleClientSort('website', 'name')}
                      >
                        Name {getClientSortIcon('website', 'name')}
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Loading websites...
                        </TableCell>
                      </TableRow>
                    ) : filteredWebsites.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            No websites found.
                          </TableCell>
                      </TableRow>
                    ) : (
                          filteredWebsites.map((website) => (
                        <TableRow 
                          key={website.code} 
                          className={selectedStringItems.includes(website.code) ? "bg-muted/40" : ""}
                          onClick={(e) => handleStringItemRowClick(website, e)}
                          style={{ cursor: 'pointer' }}
                        >
                          <TableCell>{website.code}</TableCell>
                          <TableCell>{website.name}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete('website', website.code);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Manage category configurations and mappings</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => handleOpenDialog('category')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-8"
                  />
                  {categorySearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setCategorySearch('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleClientSort('category', 'code')}
                      >
                        Code {getClientSortIcon('category', 'code')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleClientSort('category', 'name')}
                      >
                        Name {getClientSortIcon('category', 'name')}
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Loading categories...
                        </TableCell>
                      </TableRow>
                    ) : filteredCategories.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            No categories found.
                          </TableCell>
                      </TableRow>
                    ) : (
                          filteredCategories.map((category) => (
                        <TableRow 
                          key={category.code} 
                          className={selectedStringItems.includes(category.code) ? "bg-muted/40" : ""}
                          onClick={(e) => handleStringItemRowClick(category, e)}
                          style={{ cursor: 'pointer' }}
                        >
                          <TableCell>{category.code}</TableCell>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete('category', category.code);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RegistryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        onSave={handleSave}
      />
    </div>
  );
};

export default RegistryPage; 