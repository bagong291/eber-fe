// src/services/products/productsApi.ts
import { AxiosError, AxiosResponse } from 'axios'
import apiClient from '@/services/apiClient'

/**
 * Exactly the shape your server returns on 200
 */
interface ApiWrapper<T> {
  status: 'success' | 'error'
  data: T
}

/**
 * What your UI / components actually consume
 */
export interface ApiResponse<T> {
  data: T
  success: boolean
  message: string
}

/**
 * A single product record
 */
export interface Product {
  id: number
  code: string
  
  // Multi-language fields
  application_en: string
  application_id: string
  performanceFeature_en: string
  performanceFeature_id: string
  
  // Legacy fields (for backward compatibility)
  application?: string
  performanceFeature?: string
  
  type: string
  status: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Payload for create/update
 */
export type ProductPayload = {
  code: string
  application_en: string
  application_id: string
  performanceFeature_en: string
  performanceFeature_id: string
  type: string
  status: boolean
}

/**
 * Shape of list response (data + filters + meta)
 */
export interface ProductsListData {
  data: Product[]
  filter_feature: {
    types: string[]
    applications: string[]
  }
  meta: {
    page: number
    total: number
    pageSize: number
  }
}

/**
 * Filter interface for products
 */
export interface ProductFilter {
  search?: string
  code?: string
  type?: string[]
  application?: string[]
}

/**
 * Shared try/catch for all ApiWrapper<T> calls
 */
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

/**
 * List products (GET with query parameters)
 */
export function listProducts(
  filter: ProductFilter = {},
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<ProductsListData>> {
  const params: Record<string, string | number | string[]> = { page, pageSize }
  
  // Add filter parameters
  if (filter.search) params.search = filter.search
  if (filter.code) params.code = filter.code
  if (filter.type && Array.isArray(filter.type) && filter.type.length > 0) params.type = filter.type
  if (filter.application && Array.isArray(filter.application) && filter.application.length > 0) params.application = filter.application

  return handleRequest(
    apiClient.get<ApiWrapper<ProductsListData>>(`/products`, {
      params,
    })
  )
}

/**
 * Create a new product
 */
export function createProduct(
  payload: ProductPayload
): Promise<ApiResponse<Product>> {
  return handleRequest(
    apiClient.post<ApiWrapper<Product>>(`/products`, payload)
  )
}

/**
 * Update an existing product
 */
export function updateProduct(
  id: number,
  payload: ProductPayload
): Promise<ApiResponse<Product>> {
  return handleRequest(
    apiClient.put<ApiWrapper<Product>>(`/products/${id}`, payload)
  )
}

/**
 * Delete a product (DELETE with body payload)
 */
export async function deleteProduct(
  id: number,
  payload: ProductPayload
): Promise<ApiResponse<null>> {
  try {
    await apiClient.delete(`/products/${id}`, { data: payload })
    return { data: null, success: true, message: 'Deleted successfully' }
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
