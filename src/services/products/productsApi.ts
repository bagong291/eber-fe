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
  application: string
  performanceFeature: string
  type: string
  createdAt: string
  updatedAt: string
}

/**
 * Payload for create/update
 */
export type ProductPayload = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt'
>

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
 * List products (GET with body { filter, page })
 */
export function listProducts(
  filter: { type: string[]; application: string[] },
  page: number
): Promise<ApiResponse<ProductsListData>> {
  return handleRequest(
    apiClient.get<ApiWrapper<ProductsListData>>(`/products`, {
      data: { filter, page },
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
