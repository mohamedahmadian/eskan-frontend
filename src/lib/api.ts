import axios from 'axios'

const envApiUrl = import.meta.env.VITE_API_URL?.trim()

export const apiBaseUrl = envApiUrl ? envApiUrl.replace(/\/+$/, '') : '/api'

export const api = axios.create({
  baseURL: apiBaseUrl,
})

export function getImageUrl(id: string): string {
  return `${apiBaseUrl}/images/${id}`
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }
  const message = error.response?.data?.message
  if (typeof message === 'string' && message.trim()) {
    return message
  }
  if (Array.isArray(message)) {
    const text = message.filter((item) => typeof item === 'string').join('، ')
    if (text) {
      return text
    }
  }
  return fallback
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eskan_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eskan_token')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)
