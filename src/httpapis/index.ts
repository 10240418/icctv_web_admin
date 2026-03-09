import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('icctv-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // 在此统一处理错误，例如弹出消息或记录日志
    return Promise.reject(error)
  },
)





