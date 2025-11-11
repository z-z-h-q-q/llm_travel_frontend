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
    try {
      supabase.auth.signOut()
    } catch (e) {
      // ignore
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
  }
})
