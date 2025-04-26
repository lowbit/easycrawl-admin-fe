import axios from 'axios';

export interface CrawlerRawDTO {
  id: number;
  configCode: string;
  title: string;
  link: string;
  priceString: string;
  price: number;
  oldPrice: number;
  discount: number;
  created: string;
  modified: string;
  jobId: number;
}

export interface CrawlerRawFilter {
  configCode?: string;
  website?: string;
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  createdFrom?: string;
  createdTo?: string;
  jobId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const BASE_URL = `${API_URL}/crawler-raw`;

export const crawlerRawService = {
  getAll: async (filters: CrawlerRawFilter) => {
    const params = new URLSearchParams();
    
    if (filters.configCode) params.append('configCode', filters.configCode);
    if (filters.website) params.append('website', filters.website);
    if (filters.title) params.append('title', filters.title);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) params.append('createdTo', filters.createdTo);
    if (filters.jobId) params.append('jobId', filters.jobId.toString());
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sort) {
      filters.sort.forEach(sort => params.append('sort', sort));
    }

    const response = await axios.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getByJobId: async (jobId: number) => {
    const response = await axios.get(`${BASE_URL}/by-job-id/${jobId}`);
    return response.data;
  },

  create: async (data: Omit<CrawlerRawDTO, 'id'>) => {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CrawlerRawDTO>) => {
    const response = await axios.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await axios.delete(`${BASE_URL}/${id}`);
  }
}; 