// src/services/articlesApi.ts
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
 * Image as returned by the API
 */
export interface ArticleImage {
  extension: string
  data: string
  name: string
}

/**
 * Full Article record as returned by the API
 */
export interface Article {
  id: number
  title: string
  body: string
  author: string
  image: string // Changed from ArticleImage to string (URL)
  createdAt: string
  updatedAt: string
}

/**
 * Payload for the image when creating/updating
 */
export interface ArticleImagePayload {
  extension: string
  data: string
  name: string // Added name field for submission
}

/**
 * Payload you send when creating or updating
 */
export type ArticlePayload = Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'image'> & {
  image: ArticleImagePayload
}

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
    let empty = (null as unknown) as T

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
 * Fetch a single article by ID
 */
export function getArticle(id: number): Promise<ApiResponse<Article>> {
  return handleRequest(
    apiClient.get<ApiWrapper<Article>>(`/articles/${id}`)
  )
}

/**
 * Fetch all articles
 */
export function listArticles(): Promise<ApiResponse<Article[]>> {
  return handleRequest(
    apiClient.get<ApiWrapper<Article[]>>(`/articles`)
  )
}

/**
 * Create a new article
 */
export function createArticle(
  payload: ArticlePayload
): Promise<ApiResponse<Article>> {
  return handleRequest(
    apiClient.post<ApiWrapper<Article>>(`/articles`, payload)
  )
}

/**
 * Update an existing article
 */
export function updateArticle(
  id: number,
  payload: ArticlePayload
): Promise<ApiResponse<Article>> {
  return handleRequest(
    apiClient.put<ApiWrapper<Article>>(`/articles/${id}`, payload)
  )
}

/**
 * Delete an article (assumes a 204 No Content response)
 */
export async function deleteArticle(
  id: number
): Promise<ApiResponse<null>> {
  try {
    await apiClient.delete(`/articles/${id}`)
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
