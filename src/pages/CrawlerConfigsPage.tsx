import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrawlerConfigDTO, CrawlerConfigFilter, crawlerConfigService } from '@/services/crawlerConfigService';
import { format } from 'date-fns';
import { RotateCw, Settings2, Play, PlayCircle, Edit, Trash2, Plus, ListFilter } from "lucide-react";
import { toast } from 'sonner';
import { CrawlerConfigDialog } from '@/components/CrawlerConfigDialog';
import { TestRunDialog } from '@/components/TestRunDialog';
import { DropdownDTO, registryService } from '@/services/registryService';

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export default function CrawlerConfigsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<CrawlerConfigDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websites, setWebsites] = useState<DropdownDTO[]>([]);
  const [categories, setCategories] = useState<DropdownDTO[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState({
    code: true,
    website: true,
    category: true,
    startUrl: true,
    active: true,
    created: true,
    actions: true,
  });
  const [filters, setFilters] = useState<CrawlerConfigFilter>({
    page: 0,
    size: 10,
    sort: ['created,desc']
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<CrawlerConfigDTO | undefined>(undefined);
  const [testRunDialogOpen, setTestRunDialogOpen] = useState(false);
  const [selectedConfigForTestRun, setSelectedConfigForTestRun] = useState<CrawlerConfigDTO | undefined>(undefined);
  const [isTestRun, setIsTestRun] = useState(true); // Whether the run is a test run or a full run

  const fetchDropdowns = async () => {
    try {
      const [websitesData, categoriesData] = await Promise.all([
        registryService.getWebsitesDropdown(),
        registryService.getCategoriesDropdown()
      ]);
      setWebsites(websitesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await crawlerConfigService.getAll(filters);
      setData(response);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (key: keyof CrawlerConfigFilter, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'page' || key === 'size' ? Number(value) : value,
      page: key === 'page' ? Number(value) : 0
    }));
  };

  const handleWebsiteChange = (value: string) => {
    const newWebsiteCode = value === 'ALL' ? '' : value;
    setSelectedWebsite(newWebsiteCode);
    handleFilterChange('website', newWebsiteCode);
  };

  const handleCategoryChange = (value: string) => {
    const newCategoryCode = value === 'ALL' ? '' : value;
    setSelectedCategory(newCategoryCode);
    handleFilterChange('category', newCategoryCode);
  };

  const handleSort = (column: string) => {
    const currentSort = filters.sort?.[0] || '';
    const [currentColumn, currentDirection] = currentSort.split(',');
    
    const newDirection = currentColumn === column && currentDirection === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({
      ...prev,
      sort: [`${column},${newDirection}`]
    }));
  };

  const getSortDirection = (column: string) => {
    const currentSort = filters.sort?.[0] || '';
    const [currentColumn, direction] = currentSort.split(',');
    return currentColumn === column ? direction : undefined;
  };

  // Handle Run (both test run and normal run)
  const handleRunConfig = (config: CrawlerConfigDTO, testRun: boolean = false) => {
    setSelectedConfigForTestRun(config);
    setIsTestRun(testRun);
    setTestRunDialogOpen(true);
  };

  // Handle save and test run
  const handleTestRunAfterSave = (config: CrawlerConfigDTO) => {
    setSelectedConfigForTestRun(config);
    setIsTestRun(true);
    setTestRunDialogOpen(true);
  };

  const handleDeleteConfig = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete config ${code}?`)) {
      return;
    }

    try {
      setLoading(true);
      await crawlerConfigService.delete(code);
      toast.success(`Config ${code} deleted successfully`);
      fetchData();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error(`Failed to delete config ${code}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the edit dialog
  const handleEditConfig = (config: CrawlerConfigDTO) => {
    setEditConfig(config);
    setDialogOpen(true);
  };

  // Handle opening the create dialog
  const handleCreateConfig = () => {
    setEditConfig(undefined);
    setDialogOpen(true);
  };

  // Handle saving the config (create or update)
  const handleSaveConfig = async (data: CrawlerConfigDTO): Promise<boolean> => {
    try {
      setLoading(true);
      if (data.code) {
        // Update existing config
        await crawlerConfigService.update(data.code, data);
        toast.success(`Config ${data.code} updated successfully`);
      } else {
        // Create new config
        await crawlerConfigService.create(data);
        toast.success("New config created successfully");
      }
      fetchData();
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(`Failed to ${data.code ? 'update' : 'create'} config`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to jobs filtered by this config
  const handleViewJobs = (config: CrawlerConfigDTO) => {
    // Encode the config code to handle slashes and special characters
    const encodedConfig = encodeURIComponent(config.code);
    navigate(`/jobs?config=${encodedConfig}`);
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center">Loading...</TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center text-red-500">{error}</TableCell>
        </TableRow>
      );
    }

    if (!data || data.content.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center">No data found</TableCell>
        </TableRow>
      );
    }

    return data.content.map((item: CrawlerConfigDTO) => (
      <TableRow key={item.code}>
        {columnVisibility.code && (
          <TableCell>{item.code}</TableCell>
        )}
        {columnVisibility.website && (
          <TableCell>{item.crawlerWebsite}</TableCell>
        )}
        {columnVisibility.category && (
          <TableCell>{item.productCategory}</TableCell>
        )}
        {columnVisibility.startUrl && (
          <TableCell>
            <a href={item.startUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {item.startUrl}
            </a>
          </TableCell>
        )}
        {columnVisibility.active && (
          <TableCell>{item.active ? 'Yes' : 'No'}</TableCell>
        )}
        {columnVisibility.created && (
          <TableCell>{format(new Date(item.created || ''), 'yyyy-MM-dd HH:mm')}</TableCell>
        )}
        {columnVisibility.actions && (
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRunConfig(item, false)}>
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRunConfig(item, true)}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Test Run
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewJobs(item)}>
                  <ListFilter className="h-4 w-4 mr-2" />
                  View Jobs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditConfig(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteConfig(item.code)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Crawler Configs</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateConfig}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Config
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                >
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
                  setFilters({
                    page: 0,
                    size: 10,
                    sort: ['created,desc']
                  });
                  setSelectedWebsite('');
                  setSelectedCategory('');
                  fetchData();
                }}
                disabled={loading}
              >
                {loading ? (
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCw className="h-4 w-4 mr-2" />
                )}
                Reset & Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-4">
              <Select
                value={selectedWebsite || 'ALL'}
                onValueChange={handleWebsiteChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Website" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Websites</SelectItem>
                  {websites.map((website) => (
                    <SelectItem key={website.code} value={website.code}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-4">
              <Select
                value={selectedCategory || 'ALL'}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((category) => (
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
                  {columnVisibility.code && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('code')}>
                      Code {getSortDirection('code') === 'asc' ? '↑' : getSortDirection('code') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.website && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('crawlerWebsite')}>
                      Website {getSortDirection('crawlerWebsite') === 'asc' ? '↑' : getSortDirection('crawlerWebsite') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.category && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('productCategory')}>
                      Category {getSortDirection('productCategory') === 'asc' ? '↑' : getSortDirection('productCategory') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.startUrl && (
                    <TableHead>Start URL</TableHead>
                  )}
                  {columnVisibility.active && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('active')}>
                      Active {getSortDirection('active') === 'asc' ? '↑' : getSortDirection('active') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.created && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('created')}>
                      Created {getSortDirection('created') === 'asc' ? '↑' : getSortDirection('created') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.actions && (
                    <TableHead>Actions</TableHead>
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
                value={filters.size?.toString() || '10'}
                onValueChange={(value: string) => handleFilterChange('size', Number(value))}
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
                disabled={loading || !data || !filters.page}
                onClick={() => handleFilterChange('page', 0)}
                size="sm"
              >
                First
              </Button>
              <Button
                variant="outline"
                disabled={loading || !data || !filters.page}
                onClick={() => handleFilterChange('page', (filters.page || 0) - 1)}
                size="sm"
              >
                Previous
              </Button>
              {data && (
                <span className="flex items-center mx-2 text-sm text-gray-500">
                  {(filters.page || 0) + 1} / {data.totalPages}
                </span>
              )}
              <Button
                variant="outline"
                disabled={loading || !data || (filters.page || 0) >= (data?.totalPages || 0) - 1}
                onClick={() => handleFilterChange('page', (filters.page || 0) + 1)}
                size="sm"
              >
                Next
              </Button>
              <Button
                variant="outline"
                disabled={loading || !data || (filters.page || 0) >= (data?.totalPages || 0) - 1}
                onClick={() => handleFilterChange('page', (data?.totalPages || 1) - 1)}
                size="sm"
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <CrawlerConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editConfig}
        websites={websites}
        categories={categories}
        onSave={handleSaveConfig}
        onTestRun={handleTestRunAfterSave}
      />

      {/* Test Run Dialog */}
      <TestRunDialog
        open={testRunDialogOpen}
        onOpenChange={setTestRunDialogOpen}
        config={selectedConfigForTestRun}
        isTestRun={isTestRun}
        onEditConfig={() => {
          setTestRunDialogOpen(false);
          if (selectedConfigForTestRun) {
            handleEditConfig(selectedConfigForTestRun);
          }
        }}
        onConfigActivated={fetchData}
      />
    </div>
  );
} 