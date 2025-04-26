import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, ExternalLink, RotateCcw, RotateCw, AlertCircle, Clock, CheckCircle, Settings2, X } from 'lucide-react';
import { jobService, JobDTO, JobErrorDTO, JobFilter } from '@/services/jobService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function JobsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState<JobFilter>({
    page: 0,
    size: 10,
    sort: 'created',
    direction: 'desc',
    jobType: 'all',
    status: 'all',
    config: undefined
  });
  
  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    jobType: true,
    config: true,
    status: true,
    created: true,
    started: true,
    finished: true,
    actions: true,
  });
  
  // Dialogs
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedJobErrors, setSelectedJobErrors] = useState<JobErrorDTO[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDTO | null>(null);
  
  // Parse URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const configParam = searchParams.get('config');
    
    if (configParam) {
      setFilters(prev => ({
        ...prev,
        config: decodeURIComponent(configParam),
        jobType: 'CRAWL' // When filtering by config, we're typically looking for CRAWL jobs
      }));
    }
  }, [location.search]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobService.getFiltered(filters);
      
      setJobs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters.page, filters.size, filters.sort, filters.direction, filters.jobType, filters.status, filters.config]);

  const handleFilterChange = (key: keyof JobFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 0
    }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      direction: prev.sort === field && prev.direction === 'asc' ? 'desc' : 'asc',
      page: 0
    }));
  };

  const getSortDirection = (column: string) => {
    return filters.sort === column ? filters.direction : undefined;
  };

  const handleSearch = () => {
    fetchJobs();
  };
  
  const clearFilters = () => {
    // Clear URL parameters
    navigate('/jobs', { replace: true });
    
    setFilters({
      page: 0,
      size: 10,
      sort: 'created',
      direction: 'desc',
      jobType: 'all',
      status: 'all',
      config: undefined
    });
  };

  const handleViewItems = (job: JobDTO) => {
    navigate(`/crawler-raw?jobId=${job.id}`);
  };

  const handleRetryJob = async (job: JobDTO) => {
    try {
      setLoading(true);
      
      if (job.jobType === 'CRAWL') {
        await jobService.createCrawlerJob(job.crawlerConfigCode, job.testRun || false, job.crawlerWebsiteCode);
        toast.success('Crawler job retried successfully');
      } else if (job.jobType === 'PRODUCT_MAPPING') {
        await jobService.createProductMappingJob(job.crawlerConfigCode || '', job.parameters);
        toast.success('Product mapping job retried successfully');
      } else if (job.jobType === 'PRODUCT_CLEANUP') {
        await jobService.createProductCleanupJob(job.parameters);
        toast.success('Product cleanup job retried successfully');
      }
      
      fetchJobs();
    } catch (error) {
      console.error('Error retrying job:', error);
      toast.error('Failed to retry job');
    } finally {
      setLoading(false);
    }
  };

  const handleViewErrors = async (job: JobDTO) => {
    try {
      setLoading(true);
      setSelectedJob(job);
      
      const errors = await jobService.getErrors(job.id);
      setSelectedJobErrors(errors);
      setErrorDialogOpen(true);
    } catch (error) {
      console.error('Error fetching job errors:', error);
      toast.error('Failed to load job errors');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Created':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Running':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Finished':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  const renderTableContent = () => {
    if (loading && !jobs.length) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center h-24">Loading...</TableCell>
        </TableRow>
      );
    }

    if (!jobs.length) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center h-24">No jobs found.</TableCell>
        </TableRow>
      );
    }

    return jobs.map((job) => (
      <TableRow key={job.id}>
        {columnVisibility.id && (
          <TableCell>{job.id}</TableCell>
        )}
        {columnVisibility.jobType && (
          <TableCell>{job.jobType}</TableCell>
        )}
        {columnVisibility.config && (
          <TableCell>
            {job.crawlerConfigCode ? (
              <div className="max-w-xs truncate">
                <span className="font-medium">{job.crawlerConfigCode}</span>
                {job.testRun && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Test
                  </Badge>
                )}
              </div>
            ) : (
              job.parameters && (
                <div className="text-sm text-muted-foreground">
                  Params: {job.parameters.substring(0, 20)}...
                </div>
              )
            )}
          </TableCell>
        )}
        {columnVisibility.status && (
          <TableCell>
            <div className="flex items-center gap-2">
              {getStatusIcon(job.status)}
              {job.status}
            </div>
          </TableCell>
        )}
        {columnVisibility.created && (
          <TableCell>{formatDate(job.created)}</TableCell>
        )}
        {columnVisibility.started && (
          <TableCell>{formatDate(job.startedAt)}</TableCell>
        )}
        {columnVisibility.finished && (
          <TableCell>{formatDate(job.finishedAt)}</TableCell>
        )}
        {columnVisibility.actions && (
          <TableCell>
            {(job.jobType === 'CRAWL' || job.status === 'Failed') ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {job.jobType === 'CRAWL' && (
                    <DropdownMenuItem onClick={() => handleViewItems(job)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Items
                    </DropdownMenuItem>
                  )}
                  
                  {job.status === 'Failed' && (
                    <>
                      <DropdownMenuItem onClick={() => handleViewErrors(job)}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        View Errors
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => handleRetryJob(job)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retry Job
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" disabled>
                <Settings2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
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
            <div className="flex items-center gap-2">
              <CardTitle>Jobs</CardTitle>
              {filters.config && (
                <Badge variant="outline" className="ml-2">
                  Config: {filters.config}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('config', undefined);
                      navigate('/jobs', { replace: true });
                    }}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
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
                  clearFilters();
                  fetchJobs();
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
                value={filters.jobType || 'all'}
                onValueChange={(value) => handleFilterChange('jobType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CRAWL">CRAWL</SelectItem>
                  <SelectItem value="PRODUCT_MAPPING">PRODUCT_MAPPING</SelectItem>
                  <SelectItem value="PRODUCT_CLEANUP">PRODUCT_CLEANUP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-4">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Finished">Finished</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-4">
              <div className="flex space-x-2 items-center">
                <Input
                  placeholder="Filter by config code"
                  value={filters.config || ''}
                  onChange={(e) => handleFilterChange('config', e.target.value || undefined)}
                />
                {filters.config && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleFilterChange('config', undefined)}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnVisibility.id && (
                    <TableHead 
                      className="w-[60px] cursor-pointer"
                      onClick={() => handleSort('id')}
                    >
                      ID {getSortDirection('id') === 'asc' ? '↑' : getSortDirection('id') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.jobType && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('jobType')}
                    >
                      Type {getSortDirection('jobType') === 'asc' ? '↑' : getSortDirection('jobType') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.config && (
                    <TableHead>Config</TableHead>
                  )}
                  {columnVisibility.status && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortDirection('status') === 'asc' ? '↑' : getSortDirection('status') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.created && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('created')}
                    >
                      Created {getSortDirection('created') === 'asc' ? '↑' : getSortDirection('created') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.started && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('startedAt')}
                    >
                      Started {getSortDirection('startedAt') === 'asc' ? '↑' : getSortDirection('startedAt') === 'desc' ? '↓' : ''}
                    </TableHead>
                  )}
                  {columnVisibility.finished && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('finishedAt')}
                    >
                      Finished {getSortDirection('finishedAt') === 'asc' ? '↑' : getSortDirection('finishedAt') === 'desc' ? '↓' : ''}
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
                disabled={loading || filters.page === 0}
                onClick={() => handleFilterChange('page', 0)}
                size="sm"
              >
                First
              </Button>
              <Button
                variant="outline"
                disabled={loading || filters.page === 0}
                onClick={() => handleFilterChange('page', (filters.page || 0) - 1)}
                size="sm"
              >
                Previous
              </Button>
              <span className="flex items-center mx-2 text-sm text-gray-500">
                {(filters.page || 0) + 1} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                disabled={loading || (filters.page || 0) >= (totalPages || 0) - 1}
                onClick={() => handleFilterChange('page', (filters.page || 0) + 1)}
                size="sm"
              >
                Next
              </Button>
              <Button
                variant="outline"
                disabled={loading || (filters.page || 0) >= (totalPages || 0) - 1}
                onClick={() => handleFilterChange('page', (totalPages || 1) - 1)}
                size="sm"
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Errors</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="mb-4 p-4 border rounded-md">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Job ID:</strong> {selectedJob.id}</div>
                <div><strong>Type:</strong> {selectedJob.jobType}</div>
                <div><strong>Config:</strong> {selectedJob.crawlerConfigCode || 'N/A'}</div>
                <div><strong>Status:</strong> {selectedJob.status}</div>
                <div><strong>Created:</strong> {formatDate(selectedJob.created)}</div>
                <div><strong>Finished:</strong> {formatDate(selectedJob.finishedAt)}</div>
              </div>
              {selectedJob.errorMessage && (
                <div className="mt-2 p-2 border rounded-md">
                  <strong>Error Message:</strong> {selectedJob.errorMessage}
                </div>
              )}
            </div>
          )}
          
          {selectedJobErrors.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No detailed errors found.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedJobErrors.map((error, index) => (
                <div key={index} className="p-4 border rounded-md">
                  <div className="font-medium mb-2 flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-destructive" />
                    <div>{error.error}</div>
                  </div>
                  {error.category && (
                    <div className="text-sm ml-6">
                      <strong>Category:</strong> {error.category}
                    </div>
                  )}
                  {error.source && (
                    <div className="text-sm text-blue-600 ml-6 mt-1">
                      <a 
                        href={error.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        <span>{error.source}</span>
                      </a>
                    </div>
                  )}
                  {error.created && (
                    <div className="text-sm text-muted-foreground ml-6 mt-1">
                      <strong>Time:</strong> {formatDate(error.created)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter>
            {selectedJob && selectedJob.status === 'Failed' && (
              <Button onClick={() => handleRetryJob(selectedJob)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Job
              </Button>
            )}
            <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 