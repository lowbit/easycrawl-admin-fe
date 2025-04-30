import axios from 'axios';

export interface CrawlerConfigDTO {
  code: string;
  crawlerWebsite: string;
  productCategory: string;
  startUrl: string;
  allItemsSel: string;
  titleSel: string;
  linkSel: string;
  priceSel: string;
  useNextPageButton: boolean;
  nextPageButtonSel: string;
  maxPages: number;
  active: boolean;
  useInfiniteScroll: boolean;
  useUrlPageParameter: boolean;
  urlPageParameter: string;
  created?: string;
  createdBy?: string;
  modified?: string;
  modifiedBy?: string;
  autoSchedule: boolean;
  autoScheduleEvery: number;
}

export interface CrawlerConfigFilter {
  website?: string;
  category?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const BASE_URL = `${API_URL}/crawler-config`;

export const crawlerConfigService = {
  getAll: async (filters: CrawlerConfigFilter) => {
    const params = new URLSearchParams();
    
    if (filters.website) params.append('website', filters.website);
    if (filters.category) params.append('category', filters.category);
    if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) params.append('createdTo', filters.createdTo);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sort) {
      filters.sort.forEach(sort => params.append('sort', sort));
    }

    const response = await axios.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  getCrawlerConfigsDropdown: async (websiteCode: string) => {
    const response = await axios.get(`${BASE_URL}/crawler-config-dropdown?websiteCode=${websiteCode}`);
    return response.data;
  },

  create: async (data: CrawlerConfigDTO) => {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  },

  update: async (code: string, data: CrawlerConfigDTO) => {
    const response = await axios.put(`${BASE_URL}?code=${code}`, data);
    return response.data;
  },

  delete: async (code: string) => {
    await axios.delete(`${BASE_URL}?code=${code}`);
  },

  deleteBulk: async (codes: string[]) => {
    await axios.delete(`${BASE_URL}/bulk`, { data: codes });
  }
}; 