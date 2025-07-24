// src/services/careersApi.ts
import { AxiosError, AxiosResponse } from 'axios'
import apiClient from '@/services/apiClient'

/**
 * Exactly the shape your server now returns on 200
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
 * A career record as returned by the API
 */
export interface Career {
  id: number
  position: string
  location: string
  type: 'fulltime' | 'parttime' | 'internship' | string
  description: string
  status: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Payload you send when creating or updating
 */
export type CareerPayload = Omit<Career, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Shared try/catch for all calls that return ApiWrapper<T>
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

    return {
      data: empty,
      success: false,
      message,
    }
  }
}

/**
 * Fetch one career
 */
export function getCareer(id: number): Promise<ApiResponse<Career>> {
  return handleRequest(
    apiClient.get<ApiWrapper<Career>>(`/careers/${id}`)
  )
}

/**
 * Fetch all careers
 */
export interface CareerListResponse {
  data: Career[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export function listCareers(params?: Record<string, string | number | undefined>): Promise<ApiResponse<CareerListResponse>> {
  return handleRequest(
    apiClient.get<ApiWrapper<CareerListResponse>>(`/careers`, { params })
  )
}

/**
 * Create a new career
 */
export function createCareer(
  payload: CareerPayload
): Promise<ApiResponse<Career>> {
  return handleRequest(
    apiClient.post<ApiWrapper<Career>>(`/careers`, payload)
  )
}

/**
 * Update an existing career
 */
export function updateCareer(
  id: number,
  payload: CareerPayload
): Promise<ApiResponse<Career>> {
  return handleRequest(
    apiClient.put<ApiWrapper<Career>>(`/careers/${id}`, payload)
  )
}

/**
 * Delete a career (204 No Content)
 * Handles the 204 specially since there's no ApiWrapper
 */
export async function deleteCareer(
  id: number
): Promise<ApiResponse<null>> {
  try {
    await apiClient.delete(`/careers/${id}`)
    return {
      data: null,
      success: true,
      message: 'Deleted successfully',
    }
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
