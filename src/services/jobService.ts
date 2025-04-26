import axios from 'axios';

export interface JobDTO {
  id: number;
  crawlerWebsiteCode: string;
  crawlerConfigCode: string;
  status: string;
  jobType: string;
  startedAt: string;
  finishedAt: string;
  errorMessage: string;
  created: string;
  createdBy: string;
  modified: string;
  modifiedBy: string;
  testRun: boolean;
  parameters: string;
  description: string;
}

export interface JobErrorDTO {
  id: number;
  source: string;
  category: string;
  jobType: string;
  error: string;
  created: string;
  jobId: number;
}

export interface JobFilter {
  jobType?: string;
  status?: string;
  config?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const BASE_URL = `${API_URL}/api/jobs`;

export const jobService = {
  getAll: async (page: number = 0, size: number = 10, jobType?: string, status?: string, sort?: string, direction?: 'asc' | 'desc') => {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    if (jobType && jobType !== 'all') params.append('jobType', jobType);
    if (status && status !== 'all') params.append('status', status);
    
    if (sort) {
      params.append('sort', `${sort},${direction || 'desc'}`);
    }
    
    const response = await axios.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  getFiltered: async (filters: JobFilter = {}) => {
    const params = new URLSearchParams();
    
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.jobType && filters.jobType !== 'all') params.append('jobType', filters.jobType);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.config) params.append('crawlerConfigCode', filters.config);
    
    if (filters.sort) {
      params.append('sort', `${filters.sort},${filters.direction || 'desc'}`);
    }
    
    const response = await axios.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  getByType: async (jobType: string, page: number = 0, size: number = 10, sort?: string, direction?: 'asc' | 'desc') => {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('jobType', jobType);
    
    if (sort) {
      params.append('sort', `${sort},${direction || 'desc'}`);
    }
    
    const response = await axios.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getErrors: async (id: number) => {
    const response = await axios.get(`${BASE_URL}/${id}/errors`);
    return response.data as JobErrorDTO[];
  },

  create: async (data: Partial<JobDTO>) => {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  },

  triggerScheduledJobs: async () => {
    const response = await axios.post(`${BASE_URL}/schedule`);
    return response.data;
  },

  createCrawlerJob: async (configCode: string, testRun: boolean = false, websiteCode?: string) => {
    const jobData: Partial<JobDTO> = {
      crawlerConfigCode: configCode,
      jobType: 'CRAWL',
      testRun: testRun
    };
    
    if (websiteCode) {
      jobData.crawlerWebsiteCode = websiteCode;
    }
    
    const response = await axios.post(BASE_URL, jobData);
    return response.data;
  },

  createProductMappingJob: async (configOrCategory: string, parameters?: string) => {
    const url = `${BASE_URL}/product-mapping/${configOrCategory}`;
    const response = await axios.post(parameters ? `${url}?parameters=${parameters}` : url);
    return response.data;
  },

  createProductCleanupJob: async (parameters?: string) => {
    const url = `${BASE_URL}/product-cleanup`;
    const response = await axios.post(parameters ? `${url}?parameters=${parameters}` : url);
    return response.data;
  }
}; 