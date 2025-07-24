import apiClient from '../apiClient';
import { Article, Career } from '@/store/dataStore';

export interface DashboardStats {
  heroBanners: {
    total: number;
    active: number;
  };
  articles: {
    total: number;
    published: number;
    draft: number;
  };
  careers: {
    total: number;
    active: number;
    closed: number;
  };
  products: {
    total: number;
    active: number;
  };
  contacts: {
    total: number;
    unread: number;
  };
  corporateEntities: {
    total: number;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  recentArticles: Article[];
  activeCareers: Career[];
}

export interface DashboardResponse {
  status: string;
  data: DashboardData;
}

export class DashboardApiService {
  static async getDashboardData(): Promise<DashboardResponse> {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
} 