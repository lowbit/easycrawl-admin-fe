import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrawlerRawDTO, CrawlerRawFilter, crawlerRawService } from '@/services/crawlerRawService';
import { DropdownDTO, crawlerConfigService } from '@/services/crawlerConfigService';
import { format } from 'date-fns';
import { RotateCw, Settings2 } from "lucide-react";

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export default function CrawlerRawPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResponse<CrawlerRawDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websites, setWebsites] = useState<DropdownDTO[]>([]);
  const [configCodes, setConfigCodes] = useState<string[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    jobId: true,
    configCode: true,
    title: true,
    price: true,
    oldPrice: true,
    discount: true,
    created: true,
    actions: true,
  });
  const [filters, setFilters] = useState<CrawlerRawFilter>({
    page: 0,
    size: 10,
    sort: ['created,desc']
  });

  const fetchDropdowns = async () => {
    try {
      const websitesData = await crawlerConfigService.getWebsitesDropdown();
      setWebsites(websitesData);
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const fetchConfigCodes = async (websiteCode: string) => {
    if (!websiteCode) {
      setConfigCodes([]);
      return;
    }
    
    try {
      const configCodesData = await crawlerConfigService.getCrawlerConfigsDropdown(websiteCode);
      // Convert the response to array of strings
      const codes = configCodesData.map(item => item.code);
      setConfigCodes(codes);
      
      // If there's only one config code, auto-select it
      if (codes.length === 1) {
        handleFilterChange('configCode', codes[0]);
      } else if (filters.configCode && !codes.includes(filters.configCode)) {
        // Clear the config code if it's not in the new list
        handleFilterChange('configCode', undefined);
      }
    } catch (error) {
      console.error('Error fetching config codes:', error);
      setConfigCodes([]);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchConfigCodes(selectedWebsite);
  }, [selectedWebsite]);

  // Initialize filters with jobId from URL if present
  useEffect(() => {
    const jobIdParam = searchParams.get('jobId');
    if (jobIdParam) {
      setFilters(prev => ({
        ...prev,
        jobId: parseInt(jobIdParam, 10)
      }));
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await crawlerRawService.getAll(filters);
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

  const handleFilterChange = (key: keyof CrawlerRawFilter, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'page' || key === 'size' ? Number(value) : value,
      // Only reset page to 0 if we're not explicitly setting the page
      page: key === 'page' ? Number(value) : 0
    }));
  };

  const handleWebsiteChange = (value: string) => {
    const newWebsiteCode = value === 'ALL' ? '' : value;
    setSelectedWebsite(newWebsiteCode);
    // Update filters with the new website value and clear the config code
    setFilters(prev => ({
      ...prev,
      website: newWebsiteCode,
      configCode: undefined
    }));
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

    return data.content.map((item) => (
      <TableRow key={item.id}>
        {columnVisibility.id && (
          <TableCell>{item.id}</TableCell>
        )}
        {columnVisibility.jobId && (
          <TableCell>{item.jobId}</TableCell>
        )}
        {columnVisibility.configCode && (
          <TableCell>{item.configCode}</TableCell>
        )}
        {columnVisibility.title && (
          <TableCell>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {item.title}
            </a>
          </TableCell>
        )}
        {columnVisibility.price && (
          <TableCell>{item.priceString}</TableCell>
        )}
        {columnVisibility.oldPrice && (
          <TableCell>{item.oldPrice?.toFixed(2)}</TableCell>
        )}
        {columnVisibility.discount && (
          <TableCell>{item.discount?.toFixed(2)}%</TableCell>
        )}
        {columnVisibility.created && (
          <TableCell>{format(new Date(item.created), 'yyyy-MM-dd HH:mm')}</TableCell>
        )}
        {columnVisibility.actions && (
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(item.link, '_blank')}
            >
              View
            </Button>
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
            <CardTitle>Crawler Raw Data</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  onCloseAutoFocus={(e: Event) => e.preventDefault()}
                >
                  {Object.entries(columnVisibility).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked: boolean) => {
                        setColumnVisibility((prev) => ({ ...prev, [key]: checked }));
                      }}
                      onSelect={(e: Event) => e.preventDefault()}
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
            <div className="col-span-3">
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

            <div className="col-span-2">
              <Select
                value={filters.configCode || 'ALL'}
                onValueChange={(value: string) => handleFilterChange('configCode', value === 'ALL' ? undefined : value)}
                disabled={!selectedWebsite || configCodes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Config" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Configs</SelectItem>
                  {configCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Job ID"
                value={filters.jobId || ''}
                onChange={(e) => handleFilterChange('jobId', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="col-span-2">
              <Input
                placeholder="Title"
                value={filters.title || ''}
                onChange={(e) => handleFilterChange('title', e.target.value)}
              />
            </div>

            <div className="col-span-1.5">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="col-span-1.5">
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnVisibility.id && (
                    <TableHead className="cursor-pointer w-[60px]" onClick={() => handleSort('id')}>
                      ID {getSortDirection('id') === 'asc' ? '↑' : getSortDirection('id') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.jobId && (
                    <TableHead className="cursor-pointer w-[80px]" onClick={() => handleSort('jobId')}>
                      Job ID {getSortDirection('jobId') === 'asc' ? '↑' : getSortDirection('jobId') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.configCode && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('configCode')}>
                      Config Code {getSortDirection('configCode') === 'asc' ? '↑' : getSortDirection('configCode') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.title && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                      Title {getSortDirection('title') === 'asc' ? '↑' : getSortDirection('title') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.price && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                      Price {getSortDirection('price') === 'asc' ? '↑' : getSortDirection('price') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.oldPrice && (
                    <TableHead>Old Price</TableHead>
                  )}
                  {columnVisibility.discount && (
                    <TableHead>Discount</TableHead>
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
    </div>
  );
} 