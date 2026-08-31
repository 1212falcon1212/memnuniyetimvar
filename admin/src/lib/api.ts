import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');
const baseURL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminName');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function getResponseData<T>(responseData: unknown): T | null {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return (responseData as { data: T }).data;
  }

  return responseData as T;
}

export function getResponseList<T>(responseData: unknown): T[] {
  const payload = getResponseData<T[] | { data?: T[] }>(responseData);

  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export function getResponseTotalPages(responseData: unknown): number {
  const payload = getResponseData<{ meta?: { totalPages?: number }; total?: number; limit?: number }>(responseData);

  if (!payload || typeof payload !== 'object') return 1;
  if (payload.meta?.totalPages) return payload.meta.totalPages;
  if (payload.total && payload.limit) return Math.max(Math.ceil(payload.total / payload.limit), 1);

  return 1;
}

export default api;
