import apiClient from './apiClient';

export interface AdminCompanyProfileDataBox {
  column: number;
  data: { 
    name: string; 
    data: string;
    // Multi-language fields
    name_en?: string;
    name_id?: string;
    data_en?: string;
    data_id?: string;
  }[];
}

export interface AdminCompanyProfileImage {
  url: string;
  title: string;
}

export interface AdminCompanyProfileData {
  // Multi-language descriptions
  description_1_en?: string;
  description_1_id?: string;
  description_2_en?: string;
  description_2_id?: string;
  description_3_en?: string;
  description_3_id?: string;
  
  // Legacy descriptions (for backward compatibility)
  description_1?: string;
  description_2?: string;
  description_3?: string;
  
  box_1?: AdminCompanyProfileDataBox;
  box_2?: AdminCompanyProfileDataBox;
  
  // Multi-language Product Application
  p?: { 
    title_en?: string;
    title_id?: string;
    description_en?: string;
    description_id?: string;
    // Legacy fields
    title?: string; 
    description?: string;
  };
  
  // Multi-language titles
  title_1_en?: string;
  title_1_id?: string;
  title_2_en?: string;
  title_2_id?: string;
  title_3_en?: string;
  title_3_id?: string;
  
  // Legacy titles (for backward compatibility)
  title_1?: string;
  title_2?: string;
  title_3?: string;
  
  images_1?: AdminCompanyProfileImage[];
  images_2?: AdminCompanyProfileImage[];
  images_3?: AdminCompanyProfileImage[];
  
  [key: string]: any;
}

export interface AdminCompanyProfileEntity {
  id?: number;
  name: string;
  location: string;
  coordinate: string;
  // Multi-language address
  address_en?: string;
  address_id?: string;
  // Legacy field (for backward compatibility)
  address?: string;
  // Multi-language main description
  description_en?: string;
  description_id?: string;
  // Legacy field (for backward compatibility)
  description?: string;
  data: AdminCompanyProfileData;
  main_image?: string;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCompanyProfileListResponse {
  data: AdminCompanyProfileEntity[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export async function listAdminCompanyProfiles(params?: Record<string, string | number>): Promise<AdminCompanyProfileListResponse> {
  const res = await apiClient.get('/admin-company-profile', { params });
  return res.data.data;
}

export async function getAdminCompanyProfile(id: number): Promise<AdminCompanyProfileEntity> {
  const res = await apiClient.get(`/admin-company-profile/${id}`);
  return res.data.data;
}

export async function createAdminCompanyProfile(payload: AdminCompanyProfileEntity): Promise<AdminCompanyProfileEntity> {
  const res = await apiClient.post('/admin-company-profile', payload);
  return res.data.data;
}

export async function updateAdminCompanyProfile(id: number, payload: AdminCompanyProfileEntity): Promise<AdminCompanyProfileEntity> {
  const res = await apiClient.put(`/admin-company-profile/${id}`, payload);
  return res.data.data;
}

export async function deleteAdminCompanyProfile(id: number): Promise<void> {
  await apiClient.delete(`/admin-company-profile/${id}`);
}

export async function uploadCompanyProfileImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  // The backend returns { status: 'success', url: '/uploads/filename', filename: '...' }
  return res.data.url;
} 