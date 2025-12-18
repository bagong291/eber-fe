// src/services/certificates/certificatesApi.ts
import apiClient from '@/services/apiClient';

export interface Certificate {
  id?: number;
  name?: string;
  image: string;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificatesListResponse {
  data: Certificate[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export async function listCertificates(params?: Record<string, string | number>): Promise<CertificatesListResponse> {
  const res = await apiClient.get('/certificates', { params });
  return res.data.data;
}

export async function getCertificate(id: number): Promise<Certificate> {
  const res = await apiClient.get(`/certificates/${id}`);
  return res.data.data;
}

export async function createCertificate(payload: Certificate): Promise<Certificate> {
  const res = await apiClient.post('/certificates', payload);
  return res.data.data;
}

export async function updateCertificate(id: number, payload: Certificate): Promise<Certificate> {
  const res = await apiClient.put(`/certificates/${id}`, payload);
  return res.data.data;
}

export async function deleteCertificate(id: number): Promise<void> {
  await apiClient.delete(`/certificates/${id}`);
}

export async function uploadCertificateImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
}
