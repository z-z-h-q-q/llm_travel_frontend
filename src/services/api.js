import axios from 'axios'
import { ElMessage } from 'element-plus'

// 安全获取环境变量：优先读取运行时注入的 window.__ENV，其次回退到 build-time 的 import.meta.env
const getEnv = (key, defaultValue) => {
  try {
    const runtime = (typeof window !== 'undefined' && (window).__ENV) ? (window).__ENV : {}
    return (runtime && runtime[key]) || (import.meta.env && import.meta.env[key]) || defaultValue
  } catch (error) {
    return defaultValue
  }
}

// API基础配置
// 注意：生成旅行计划（后端调用 Coze 工作流）可能是长时任务。
// 将全局超时时间设置为 5 分钟（300000ms）以避免前端在等待后端生成计划时过早超时。
const API_CONFIG = {
  BASE_URL: getEnv('VITE_API_BASE_URL', 'http://localhost:3001/api'),
  TIMEOUT: 300000 // 5 minutes
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  // Don't set a global Content-Type header here — let axios/browser
  // choose the correct one per-request (especially important for FormData)
})

// Ensure axios doesn't have a default post Content-Type that forces JSON
try {
  if (apiClient.defaults && apiClient.defaults.headers) {
    if (apiClient.defaults.headers.common) delete apiClient.defaults.headers.common['Content-Type']
    if (apiClient.defaults.headers.post) delete apiClient.defaults.headers.post['Content-Type']
  }
} catch (e) {
  // ignore
}

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
  post: (url, data = {}, config = {}) => {
    // If sending FormData, ensure we don't force application/json header.
    const isForm = typeof FormData !== 'undefined' && data instanceof FormData
    if (isForm) {
      const merged = { ...(config || {}) }
      merged.headers = { ...(merged.headers || {}) }
      // remove Content-Type so browser/axios can set multipart/form-data with boundary
      if (merged.headers['Content-Type']) delete merged.headers['Content-Type']
      if (merged.headers['content-type']) delete merged.headers['content-type']
      return apiClient.post(url, data, merged)
    }
    // otherwise default behavior (JSON etc.)
    return apiClient.post(url, data, config)
  },
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config)
}

// 导出配置以便其他服务使用
export { API_CONFIG }

export default api