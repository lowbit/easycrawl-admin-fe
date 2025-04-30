import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Package,
  Code2,
  Brain,
  LineChart,
  BarChart3,
  RefreshCw,
  PieChart,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart as ReChartPie,
  Pie,
  LineChart as ReChartLine,
  Line
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import { jobService } from '@/services/jobService';
import { dashboardService } from '@/services/dashboardService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-500">Completed</Badge>;
    case 'in progress':
      return <Badge className="bg-blue-500">In Progress</Badge>;
    case 'failed':
      return <Badge className="bg-red-500">Failed</Badge>;
    case 'scheduled':
      return <Badge className="bg-yellow-500">Scheduled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch job data
  const {
    data: jobsData,
    isLoading: jobsLoading,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['dashboardJobs'],
    queryFn: async () => {
      try {
        // Get recent jobs with pagination
        return await jobService.getAll(0, 5, undefined, undefined, 'createdAt', 'desc');
      } catch (error) {
        console.error('Error fetching jobs data:', error);
        return { content: [], totalElements: 0 };
      }
    }
  });

  // Fetch dashboard stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      return await dashboardService.getStats();
    }
  });

  // Fetch activity data based on timeRange
  const {
    data: activityData,
    isLoading: activityLoading,
    refetch: refetchActivity
  } = useQuery({
    queryKey: ['dashboardActivity', timeRange],
    queryFn: async () => {
      // Convert timeRange to days
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      return await dashboardService.getActivityData(days);
    }
  });

  // Fetch category distribution
  const {
    data: categoryData,
    isLoading: categoryLoading,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['dashboardCategories'],
    queryFn: async () => {
      return await dashboardService.getCategoryDistribution();
    }
  });

  // Fetch website activity
  const {
    data: websiteActivityData,
    isLoading: websiteActivityLoading,
    refetch: refetchWebsiteActivity
  } = useQuery({
    queryKey: ['dashboardWebsiteActivity'],
    queryFn: async () => {
      return await dashboardService.getWebsiteActivity();
    }
  });

  // Fetch job status distribution
  const {
    data: jobStatusData,
    isLoading: jobStatusLoading,
    refetch: refetchJobStatus
  } = useQuery({
    queryKey: ['dashboardJobStatus'],
    queryFn: async () => {
      return await dashboardService.getJobStatusDistribution();
    }
  });

  // Method to handle refresh of all data
  const handleRefresh = () => {
    refetchJobs();
    refetchStats();
    refetchActivity();
    refetchCategories();
    refetchWebsiteActivity();
    refetchJobStatus();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {format(new Date(), 'MMM dd, yyyy h:mm a')}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statsData?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+{statsData?.newProductsThisMonth || 0}</span> from last month
                  </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statsData?.activeJobs || 0}</div>
                <p className="text-xs text-muted-foreground">
                    <span className={statsData?.activeJobsChange && statsData.activeJobsChange > 0 ? 'text-green-500' : 'text-red-500'}>
                      {statsData?.activeJobsChange && statsData.activeJobsChange > 0 ? '+' : ''}{statsData?.activeJobsChange || 0}%
                    </span> from last week
                  </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statsData?.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                    <span className={statsData?.successRateChange && statsData.successRateChange > 0 ? 'text-green-500' : 'text-red-500'}>
                      {statsData?.successRateChange && statsData.successRateChange > 0 ? '+' : ''}{statsData?.successRateChange || 0}%
                    </span> from last month
                  </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statsData?.errorRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                    <span className={statsData?.errorRateChange && statsData.errorRateChange < 0 ? 'text-green-500' : 'text-red-500'}>
                      {statsData?.errorRateChange || 0}%
                    </span> from last month
                  </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Crawling Activity</CardTitle>
              <CardDescription>Product crawling trends over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7d
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30d
              </Button>
              <Button
                variant={timeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90d')}
              >
                90d
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {activityLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-[80%] w-[90%]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activityData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCrawled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="crawled"
                      name="Crawled"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorCrawled)"
                    />
                    <Area
                      type="monotone"
                      dataKey="processed"
                      name="Processed"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorProcessed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Job Status</CardTitle>
            <CardDescription>Current distribution of all jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex justify-center items-center">
              {jobStatusLoading ? (
                <Skeleton className="h-64 w-64 rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart width={400} height={400}>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jobStatusData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} jobs`, '']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Website Activity and Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Website Activity</CardTitle>
            <CardDescription>Products crawled per website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {websiteActivityLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-[80%] w-[90%]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={websiteActivityData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="crawled" name="Successful" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="failed" name="Failed" fill="hsl(var(--chart-5))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
            <CardDescription>Distribution of products across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {categoryLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-64 w-64 rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart width={400} height={400}>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} products`, '']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>
            Latest job activity in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  Array(5).fill(null).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                  ))
                ) : jobsData?.content?.length ? (
                  jobsData.content.map((job: any) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.id}</TableCell>
                      <TableCell>{job.jobType}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{format(parseISO(job.createdAt), 'MMM dd, h:mm a')}</TableCell>
                      <TableCell>
                        {job.completedAt && job.startedAt ?
                          `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000)}m` :
                          job.startedAt ? <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Running</span> : 'Pending'}
                      </TableCell>
                      <TableCell>{job.processedItems || 0}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No recent jobs found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 