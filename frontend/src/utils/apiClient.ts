/**
 * API Client Utility
 * Handles all HTTP requests with authentication
 */

export class ApiError extends Error {
  status: number
  data?: any

  constructor(status: number, message: string, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Get the current auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken')
}

/**
 * Set the auth token in localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token)
}

/**
 * Clear the auth token from localStorage
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUserId')
}

/**
 * Make an API request with authentication
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send cookies if using HTTP-only cookies
    })

    // Handle 401 Unauthorized - clear auth and redirect
    if (response.status === 401) {
      clearAuthToken()
      // Trigger logout in auth store
      const { useAuthStore } = await import('../stores')
      useAuthStore.getState().logout()
      // Redirect to login
      window.location.href = '/login'
      throw new ApiError(401, 'Unauthorized. Please login again.')
    }

    // Handle error responses
    if (!response.ok) {
      let errorData: any = null
      try {
        errorData = await response.json()
      } catch {
        // Response is not JSON
      }

      const errorMessage =
        errorData?.error?.message ||
        errorData?.message ||
        `HTTP ${response.status}: ${response.statusText}`

      throw new ApiError(response.status, errorMessage, errorData)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    // Parse response
    const data = await response.json()
    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error')
  }
}

/**
 * GET request
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: 'GET' })
}

/**
 * POST request
 */
export const apiPost = async <T = any>(
  endpoint: string,
  body?: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PATCH request
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  body?: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE request
 */
export const apiDelete = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: 'DELETE' })
}

/**
 * PUT request
 */
export const apiPut = async <T = any>(
  endpoint: string,
  body?: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export default {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
  put: apiPut,
  call: apiCall,
  getToken: getAuthToken,
  setToken: setAuthToken,
  clearToken: clearAuthToken,
}
