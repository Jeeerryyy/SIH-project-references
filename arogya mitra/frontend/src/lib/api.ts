/**
 * Arogya Mitra API Client
 * Wraps native fetch with JWT bearer tokens, base URL, and JSON handling.
 */

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('arogya_access_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired
    localStorage.removeItem('arogya_access_token');
    localStorage.removeItem('arogya_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError('Unauthorized. Please login again.', 401);
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    let data;
    try {
      data = await response.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      errorMsg = response.statusText;
    }
    throw new ApiError(errorMsg, response.status, data);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body: any) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = any>(url: string, body: any) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, {
      method: 'PATCH',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};
