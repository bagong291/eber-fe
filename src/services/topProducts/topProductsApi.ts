import { AxiosError, AxiosResponse } from 'axios'
import apiClient from '@/services/apiClient'

interface ApiWrapper<T> {
  status: 'success' | 'error'
  data: T
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message: string
}

export interface TopProduct {
  id: number
  product_id: number
  rank: number
  createdAt: string
  updatedAt: string
  product: {
    id: number
    code: string
    application_en: string
    application_id: string
    type: string
    status: boolean
  }
}

export interface TopProductPayload {
  product_id: number
  rank: number
}

async function handleRequest<T>(
  request: Promise<AxiosResponse<ApiWrapper<T>>>
): Promise<ApiResponse<T>> {
  try {
    const response = await request
    const wrapper = response.data
    const ok = wrapper.status === 'success'
    return {
      data: wrapper.data,
      success: ok,
      message: ok ? '' : `API returned status=${wrapper.status}`,
    }
  } catch (err) {
    let message = 'Network or server error'
    const empty = (null as unknown) as T

    if ((err as AxiosError).isAxiosError) {
      const axiosErr = err as AxiosError<{ message?: string }>
      message =
        axiosErr.response?.data?.message ??
        axiosErr.response?.statusText ??
        axiosErr.message
    } else if (err instanceof Error) {
      message = err.message
    }

    return { data: empty, success: false, message }
  }
}

export function listTopProducts(): Promise<ApiResponse<TopProduct[]>> {
  return handleRequest(
    apiClient.get<ApiWrapper<TopProduct[]>>('/top-products')
  )
}

export function addTopProduct(
  payload: TopProductPayload
): Promise<ApiResponse<TopProduct>> {
  return handleRequest(
    apiClient.post<ApiWrapper<TopProduct>>('/top-products', payload)
  )
}

export function updateTopProductRank(
  id: number,
  rank: number
): Promise<ApiResponse<TopProduct>> {
  return handleRequest(
    apiClient.put<ApiWrapper<TopProduct>>(`/top-products/${id}`, { rank })
  )
}

export async function removeTopProduct(id: number): Promise<ApiResponse<null>> {
  try {
    await apiClient.delete(`/top-products/${id}`)
    return { data: null, success: true, message: 'Removed successfully' }
  } catch (err) {
    let message = 'Network or server error'
    if ((err as AxiosError).isAxiosError) {
      const axiosErr = err as AxiosError<{ message?: string }>
      message =
        axiosErr.response?.data?.message ??
        axiosErr.response?.statusText ??
        axiosErr.message
    } else if (err instanceof Error) {
      message = err.message
    }
    return { data: null, success: false, message }
  }
}
