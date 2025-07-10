// src/services/apiClient.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const api_url = import.meta.env.VITE_API_URL as string;
const apiClient = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically attach the Bearer token (if any) to every request
apiClient.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = useAuthStore.getState().getToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
