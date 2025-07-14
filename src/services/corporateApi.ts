import apiClient from './apiClient';

export interface CorporateDataBox {
  column: number;
  data: { name: string; data: string }[];
}

export interface CorporateImage {
  url: string;
  title: string;
}

export interface CorporateData {
  description_1?: string;
  box_1?: CorporateDataBox;
  description_2?: string;
  box_2?: CorporateDataBox;
  p?: { title: string; description: string };
  title_1?: string;
  images_1?: CorporateImage[];
  title_2?: string;
  images_2?: CorporateImage[];
  title_3?: string;
  description_3?: string;
  images_3?: CorporateImage[];
  [key: string]: any;
}

export interface CorporateEntity {
  id?: number;
  name: string;
  location: string;
  coordinate: string;
  address: string;
  description: string;
  data: CorporateData;
  createdAt?: string;
  updatedAt?: string;
}

export interface CorporateListResponse {
  data: CorporateEntity[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export async function listCorporates(params?: Record<string, string | number>): Promise<CorporateListResponse> {
  const res = await apiClient.get('/corporate', { params });
  return res.data.data;
}

export async function getCorporate(id: number): Promise<CorporateEntity> {
  const res = await apiClient.get(`/corporate/${id}`);
  return res.data.data;
}

export async function createCorporate(payload: CorporateEntity): Promise<CorporateEntity> {
  const res = await apiClient.post('/corporate', payload);
  return res.data.data;
}

export async function updateCorporate(id: number, payload: CorporateEntity): Promise<CorporateEntity> {
  const res = await apiClient.put(`/corporate/${id}`, payload);
  return res.data.data;
}

export async function deleteCorporate(id: number): Promise<void> {
  await apiClient.delete(`/corporate/${id}`);
} 