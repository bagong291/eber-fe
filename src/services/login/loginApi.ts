// src/services/loginApi.ts
import { AxiosError } from 'axios';
import apiClient from '@/services/apiClient';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

export interface LoginPayload {
  token: string;
}

export async function loginApi(
  username: string,
  password: string
): Promise<ApiResponse<LoginPayload>> {
  try {
    const response = await apiClient.post<{
      data: LoginPayload;
      message?: string;
    }>('/auth/login', { username, password });
    return {
      data: response.data,
      success: true,
      // Some APIs return a message on success; fall back to a default
      message: response.data.message ?? 'Login successful',
    };
  } catch (err) {
    let message = 'Network or server error';
    let emptyData: LoginPayload = { token: '' };

    if ((err as AxiosError).isAxiosError) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      // If server returned JSON { message: "..."} use that
      message =
        axiosErr.response?.data?.message ??
        axiosErr.response?.statusText ??
        axiosErr.message;
    } else if (err instanceof Error) {
      message = err.message;
    }

    return {
      data: emptyData,
      success: false,
      message,
    };
  }
}
