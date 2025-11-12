import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import supabase from '@/services/supabase'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)
  const preferences = ref<string[]>(JSON.parse(localStorage.getItem('travel_preferences') || '[]'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      try {
        // Ensure supabase client has the session (in case page reloaded and only token saved manually)
        try {
          // if you stored refresh token too, use it; otherwise reuse access token to satisfy the type requirement
          const refresh = localStorage.getItem('refresh_token') || (token.value as string) || ''
          await supabase.auth.setSession({ access_token: token.value as string, refresh_token: refresh })
        } catch (e) {
          // ignore
        }
        // try to get user from supabase
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) {
          logout()
          return
        }
        const u = data.user
        user.value = {
          id: u.id,
          username: (u.user_metadata && (u.user_metadata as any).username) || u.email || '',
          email: u.email || ''
        }
        // 同步来自 Supabase 的 travel_preferences 到 store
        try {
          const saved = (u.user_metadata && (u.user_metadata as any).travel_preferences) || []
          preferences.value = Array.isArray(saved) ? saved : []
        } catch (e) {
          // ignore
        }
      } catch (error) {
        logout()
      }
    } else {
      // subscribe to auth state changes so we can keep token in sync
      supabase.auth.onAuthStateChange((event, session) => {
        const access = session?.access_token || null
        if (access) {
          token.value = access
          localStorage.setItem('token', access)
          // populate user if available
          const u = session?.user
          if (u) {
            user.value = {
              id: u.id,
              username: (u.user_metadata && (u.user_metadata as any).username) || u.email || '',
              email: u.email || ''
            }
              // 同步来自 Supabase 的 travel_preferences 到 store
              try {
                const saved = (u.user_metadata && (u.user_metadata as any).travel_preferences) || []
                preferences.value = Array.isArray(saved) ? saved : []
              } catch (e) {
                // ignore
              }
          }
        } else {
          // cleared
          token.value = null
          user.value = null
          localStorage.removeItem('token')
        }
      })
    }
  }

  // 登录
  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
      if (error) {
        throw error
      }
      const session = (data as any).session
      const supUser = (data as any).user
      const newToken = session?.access_token || null
      token.value = newToken
      if (newToken) {
        localStorage.setItem('token', newToken)
        // ensure supabase client session is populated
        try {
          const refresh = localStorage.getItem('refresh_token') || (newToken as string) || ''
          await supabase.auth.setSession({ access_token: newToken as string, refresh_token: refresh })
        } catch (e) {
          // ignore
        }
      }
      if (supUser) {
        user.value = {
          id: supUser.id,
          username: (supUser.user_metadata && (supUser.user_metadata as any).username) || supUser.email || '',
          email: supUser.email || ''
        }
        // 登录成功后从 supabase user metadata 中同步偏好
        try {
          const saved = (supUser.user_metadata && (supUser.user_metadata as any).travel_preferences) || []
          preferences.value = Array.isArray(saved) ? saved : []
        } catch (e) {
          // ignore
        }
      }
      ElMessage.success('登录成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData: { username: string; email: string; password: string }) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { username: userData.username } }
      })
      if (error) {
        throw error
      }
      ElMessage.success('注册成功，请登录')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '注册失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    // 不删除用户偏好，本地存储保留
    try {
      supabase.auth.signOut()
    } catch (e) {
      // ignore
    }
  }

  // 保存旅行偏好到后端（若已登录）并回写本地存储与 store
  const setPreferences = async (prefs: string[]) => {
    const arr = Array.isArray(prefs) ? prefs : []
    preferences.value = arr
    try {
      localStorage.setItem('travel_preferences', JSON.stringify(preferences.value))
    } catch (e) {
      // ignore storage errors
    }

    try {
      // 如果用户已登录，尝试将偏好写入 Supabase 用户 metadata
      // supabase.auth.updateUser 接受 { data: { ... } }
      const { data, error } = await supabase.auth.updateUser({ data: { travel_preferences: arr } })
      if (error) {
        console.error('保存旅行偏好到 supabase 失败:', error)
        return false
      }
      // 成功后，如果返回了用户信息，可以更新本地 user.value 的 metadata（非必需）
      if (data?.user) {
        try {
          // 合并 user_metadata 到 user.value（仅保守更新 username/email 不变）
          const u = data.user
          user.value = {
            id: u.id,
            username: (u.user_metadata && (u.user_metadata as any).username) || u.email || user.value?.username || '',
            email: u.email || user.value?.email || ''
          }
        } catch (e) {
          // ignore
        }
      }
      return true
    } catch (e) {
      console.error('保存旅行偏好发生异常:', e)
      return false
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    initAuth,
    login,
    register,
    logout
    ,preferences,
    setPreferences
  }
})
