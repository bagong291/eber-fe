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

export interface CompanyTopProductItem {
  id: number
  rank: number
  product: {
    id: number
    code: string
    segment: string
    application_en: string
    application_id: string
    type: string
    status: boolean
  }
}

export interface CompanyTopProductGroup {
  company: {
    id: number
    name: string
    location: string
    status: boolean
  }
  topProducts: CompanyTopProductItem[]
}

export interface CompanyTopProductPayload {
  company_profile_id: number
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

export function listCompanyTopProducts(): Promise<ApiResponse<CompanyTopProductGroup[]>> {
  return handleRequest(
    apiClient.get<ApiWrapper<CompanyTopProductGroup[]>>('/company-top-products')
  )
}

export function getCompanyTopProducts(companyId: number): Promise<ApiResponse<CompanyTopProductItem[]>> {
  return handleRequest(
    apiClient.get<ApiWrapper<CompanyTopProductItem[]>>(`/company-top-products/company/${companyId}`)
  )
}

export function addCompanyTopProduct(
  payload: CompanyTopProductPayload
): Promise<ApiResponse<CompanyTopProductItem>> {
  return handleRequest(
    apiClient.post<ApiWrapper<CompanyTopProductItem>>('/company-top-products', payload)
  )
}

export function updateCompanyTopProductRank(
  id: number,
  rank: number
): Promise<ApiResponse<CompanyTopProductItem>> {
  return handleRequest(
    apiClient.put<ApiWrapper<CompanyTopProductItem>>(`/company-top-products/${id}`, { rank })
  )
}

export async function removeCompanyTopProduct(id: number): Promise<ApiResponse<null>> {
  try {
    await apiClient.delete(`/company-top-products/${id}`)
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
