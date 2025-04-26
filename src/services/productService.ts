import axios from 'axios';

// Types
export interface ProductDTO {
  id: number;
  name: string;
  brand: string;
  model: string;
  category: string;
  imageUrl: string;
  lowestPrice: number;
  highestPrice: number;
  storeCount: number;
}

export interface ProductVariantDTO {
  id: number;
  websiteName: string;
  websiteCode: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  currency: string;
  color: string;
  size: string;
  sourceUrl: string;
  imageUrl: string;
  property1?: string;
  property2?: string;
  property3?: string;
  property4?: string;
}

export interface ProductCategoryDTO {
  code: string;
  name: string;
}

export interface ProductRegistryDTO {
  id: number;
  registryType: string;
  registryKey: string;
  registryValue: string;
  description: string;
  enabled: boolean;
}

export interface ProductSearchParams {
  name?: string;
  category?: string;
  brand?: string;
  page: number;
  size: number;
  sort?: string;
}

export interface ProductVariantFilterParams {
  title?: string;
  websiteCode?: string;
  color?: string;
  inStock?: boolean;
  size?: string;
  property1?: string;
  property2?: string;
  property3?: string;
  property4?: string;
  page: number;
  pageSize: number;
  sort?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

// Product APIs
export const getProducts = async (params: ProductSearchParams) => {
  const response = await axios.get(`${API_URL}/products/search`, { params });
  return response.data;
};

export const getProductById = async (id: number, params?: ProductVariantFilterParams) => {
  const url = new URL(`${API_URL}/products/${id}`);
  
  if (params) {
    if (params.title) url.searchParams.append('title', params.title);
    if (params.websiteCode) url.searchParams.append('websiteCode', params.websiteCode);
    if (params.color) url.searchParams.append('color', params.color);
    if (params.inStock !== undefined) url.searchParams.append('inStock', params.inStock.toString());
    if (params.size) url.searchParams.append('size', params.size);
    if (params.property1) url.searchParams.append('property1', params.property1);
    if (params.property2) url.searchParams.append('property2', params.property2);
    if (params.property3) url.searchParams.append('property3', params.property3);
    if (params.property4) url.searchParams.append('property4', params.property4);
    if (params.page !== undefined) url.searchParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) url.searchParams.append('size', params.pageSize.toString());
    if (params.sort) url.searchParams.append('sort', params.sort);
  }
  
  const response = await axios.get(url.toString());
  return response.data;
};

export const triggerProductProcessing = async () => {
  const response = await axios.post(`${API_URL}/products/process`);
  return response.data;
};

export const triggerCategoryProcessing = async (category: string) => {
  const response = await axios.post(`${API_URL}/products/process/${category}`);
  return response.data;
};

export const triggerProductCleanup = async (type?: string) => {
  const url = type ? `${API_URL}/products/cleanup?type=${type}` : `${API_URL}/products/cleanup`;
  const response = await axios.post(url);
  return response.data;
};

export const processSpecificItem = async (id: number) => {
  const response = await axios.post(`${API_URL}/products/process/item/${id}`);
  return response.data;
};

// Product Category APIs
export const getProductCategories = async () => {
  const response = await axios.get(`${API_URL}/products/categories`);
  return response.data;
};

// Product Registry APIs
export const getProductRegistry = async (queryParams?: string) => {
  const url = queryParams 
    ? `${API_URL}/product/registry?${queryParams}`
    : `${API_URL}/product/registry`;
  const response = await axios.get(url);
  return response.data;
};

export const getProductRegistryTypes = async () => {
  const response = await axios.get(`${API_URL}/product/registry/types`);
  return response.data;
};

export const createProductRegistry = async (registry: Omit<ProductRegistryDTO, 'id'>) => {
  const response = await axios.post(`${API_URL}/product/registry`, registry);
  return response.data;
};

export const updateProductRegistry = async (id: number, registry: Omit<ProductRegistryDTO, 'id'>) => {
  const response = await axios.put(`${API_URL}/product/registry/${id}`, registry);
  return response.data;
};

export const deleteProductRegistry = async (id: number) => {
  const response = await axios.delete(`${API_URL}/product/registry/${id}`);
  return response.data;
};

export const refreshProductRegistry = async () => {
  const response = await axios.post(`${API_URL}/product/registry/refresh`);
  return response.data;
};

export const bulkExportProductRegistry = async () => {
  const response = await axios.get(`${API_URL}/product/registry/bulk-export`);
  return response.data;
};

export const bulkImportProductRegistry = async (registries: Omit<ProductRegistryDTO, 'id'>[]) => {
  const response = await axios.post(`${API_URL}/product/registry/bulk-import`, registries);
  return response.data;
};

// Product Cleanup APIs
export const runProductCleanup = async () => {
  const response = await axios.post(`${API_URL}/products/cleanup-manual`);
  return response.data;
};

export const updateProductNames = async () => {
  const response = await axios.post(`${API_URL}/products/cleanup-manual/names`);
  return response.data;
};

export const mergeDuplicates = async () => {
  const response = await axios.post(`${API_URL}/products/cleanup-manual/duplicates`);
  return response.data;
};

// Product Brands
export const getProductBrands = async () => {
  const response = await axios.get(`${API_URL}/products/brands-list`);
  return response.data;
}; 