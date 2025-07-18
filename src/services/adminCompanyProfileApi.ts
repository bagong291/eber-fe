import apiClient from './apiClient';

export interface AdminCompanyProfileDataBox {
  column: number;
  data: { name: string; data: string }[];
}

export interface AdminCompanyProfileImage {
  url: string;
  title: string;
}

export interface AdminCompanyProfileData {
  description_1?: string;
  box_1?: AdminCompanyProfileDataBox;
  description_2?: string;
  box_2?: AdminCompanyProfileDataBox;
  p?: { title: string; description: string };
  title_1?: string;
  images_1?: AdminCompanyProfileImage[];
  title_2?: string;
  images_2?: AdminCompanyProfileImage[];
  title_3?: string;
  description_3?: string;
  images_3?: AdminCompanyProfileImage[];
  [key: string]: string | number | AdminCompanyProfileDataBox | AdminCompanyProfileImage[] | { title: string; description: string } | undefined;
}

export interface AdminCompanyProfileEntity {
  id?: number;
  name: string;
  location: string;
  coordinate: string;
  address: string;
  description: string;
  data: AdminCompanyProfileData;
  main_image?: string;
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