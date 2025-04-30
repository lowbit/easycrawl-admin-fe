import axios from 'axios';

export interface DropdownDTO {
    code: string;
    name: string;
}

export interface WebsiteDTO {
    code: string;
    name: string;
    url: string;
}

export interface CategoryDTO {
    code: string;
    name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const BASE_URL = `${API_URL}/registry`;

export const registryService = {
    getWebsitesDropdown: async (): Promise<DropdownDTO[]> => {
        const response = await axios.get(`${BASE_URL}/crawler-website-dropdown`);
        return response.data;
    },

    getCategoriesDropdown: async (): Promise<DropdownDTO[]> => {
        const response = await axios.get(`${BASE_URL}/product-category-dropdown`);
        return response.data;
    },

    addWebsite: async (website: WebsiteDTO): Promise<WebsiteDTO> => {
        const response = await axios.post(`${BASE_URL}/crawler-website`, website);
        return response.data;
    },

    deleteWebsite: async (id: string): Promise<void> => {
        await axios.delete(`${BASE_URL}/crawler-website/${id}`);
    },

    addCategory: async (category: DropdownDTO): Promise<DropdownDTO> => {
        const response = await axios.post(`${BASE_URL}/product-category`, category);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<void> => {
        await axios.delete(`${BASE_URL}/product-category/${id}`);
    }
}; 