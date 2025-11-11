import axios from 'axios'
import { ElMessage } from 'element-plus'

// 安全获取环境变量
const getEnv = (key, defaultValue) => {
  try {
    return (import.meta.env && import.meta.env[key]) || defaultValue
  } catch (error) {
    return defaultValue
  }
}

// API基础配置
const API_CONFIG = {
  BASE_URL: getEnv('VITE_API_BASE_URL', 'http://localhost:3001/api'),
  TIMEOUT: 10000
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // Attach Authorization header from saved token (localStorage)
    try {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch (e) {
      // ignore
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 登录过期处理
      // const userStore = useUserStore()
      // userStore.logout()
      ElMessage.error('登录已过期，请重新登录')
    }
    return Promise.reject(error)
  }
)

// 基础请求方法
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config)
}

// 导出配置以便其他服务使用
export { API_CONFIG }

export default api