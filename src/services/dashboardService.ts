import axios from 'axios';
import { subDays, format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const BASE_URL = `${API_URL}/dashboard`;

// Types for dashboard data
export interface DashboardStats {
    totalProducts: number;
    newProductsThisMonth: number;
    activeJobs: number;
    activeJobsChange: number;
    successRate: number;
    successRateChange: number;
    errorRate: number;
    errorRateChange: number;
}

export interface ActivityPoint {
    date: string;
    crawled: number;
    processed: number;
}

export interface CategoryDistribution {
    name: string;
    value: number;
}

export interface WebsiteActivity {
    name: string;
    crawled: number;
    failed: number;
}

export interface JobStatusDistribution {
    name: string;
    value: number;
}

// Dashboard service with methods for fetching dashboard data
export const dashboardService = {
    // Get key dashboard statistics
    getStats: async (): Promise<DashboardStats> => {
        try {
            // When the API is implemented, uncomment this:
            // const response = await axios.get(`${BASE_URL}/stats`);
            // return response.data;

            // Mock data for now
            return {
                totalProducts: 256,
                newProductsThisMonth: 24,
                activeJobs: 5,
                activeJobsChange: 20,
                successRate: 94.5,
                successRateChange: 2.5,
                errorRate: 5.5,
                errorRateChange: -2.5
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {
                totalProducts: 0,
                newProductsThisMonth: 0,
                activeJobs: 0,
                activeJobsChange: 0,
                successRate: 0,
                successRateChange: 0,
                errorRate: 0,
                errorRateChange: 0
            };
        }
    },

    // Get activity data for trend charts
    getActivityData: async (days: number = 30): Promise<ActivityPoint[]> => {
        try {
            // When the API is implemented, uncomment this:
            // const response = await axios.get(`${BASE_URL}/activity?days=${days}`);
            // return response.data;

            // Mock data for now
            const today = new Date();
            return Array.from({ length: days }, (_, i) => {
                const date = subDays(today, days - 1 - i);
                return {
                    date: format(date, 'MMM dd'),
                    crawled: Math.floor(Math.random() * 50) + 10,
                    processed: Math.floor(Math.random() * 40) + 5,
                };
            });
        } catch (error) {
            console.error('Error fetching activity data:', error);
            return [];
        }
    },

    // Get product distribution by category
    getCategoryDistribution: async (): Promise<CategoryDistribution[]> => {
        try {
            // When the API is implemented, uncomment this:
            // const response = await axios.get(`${BASE_URL}/category-distribution`);
            // return response.data;

            // Mock data for now
            return [
                { name: 'Electronics', value: 35 },
                { name: 'Clothing', value: 25 },
                { name: 'Home & Garden', value: 18 },
                { name: 'Toys', value: 12 },
                { name: 'Sports', value: 10 },
            ];
        } catch (error) {
            console.error('Error fetching category distribution:', error);
            return [];
        }
    },

    // Get website activity data
    getWebsiteActivity: async (): Promise<WebsiteActivity[]> => {
        try {
            // When the API is implemented, uncomment this:
            // const response = await axios.get(`${BASE_URL}/website-activity`);
            // return response.data;

            // Mock data for now
            return [
                { name: 'Amazon', crawled: 120, failed: 5 },
                { name: 'eBay', crawled: 98, failed: 3 },
                { name: 'Walmart', crawled: 86, failed: 7 },
                { name: 'Target', crawled: 65, failed: 2 },
                { name: 'BestBuy', crawled: 55, failed: 1 },
            ];
        } catch (error) {
            console.error('Error fetching website activity:', error);
            return [];
        }
    },

    // Get job status distribution
    getJobStatusDistribution: async (): Promise<JobStatusDistribution[]> => {
        try {
            // When the API is implemented, uncomment this:
            // const response = await axios.get(`${BASE_URL}/job-status-distribution`);
            // return response.data;

            // Mock data for now
            return [
                { name: 'Completed', value: 68 },
                { name: 'In Progress', value: 12 },
                { name: 'Failed', value: 8 },
                { name: 'Scheduled', value: 12 },
            ];
        } catch (error) {
            console.error('Error fetching job status distribution:', error);
            return [];
        }
    }
}; 