import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface TravelPlan {
  id: string
  title: string
  departure: string
  destination: string
  startDate: string
  endDate: string
  days: number // 旅行总天数
  budget: number
  travelers: number
  preferences: string[]
  itineraryDays: DayPlan[] // 行程天数组（避免与days字段冲突）
  createdAt: string
  updatedAt: string
}

export interface DayPlan {
  day: number
  date: string
  activities: Activity[]
  accommodation?: Accommodation
  meals: Meal[]
  transportation: Transportation[]
  estimatedCost: number
}

export interface Activity {
  id: string
  name: string
  type: 'attraction' | 'entertainment' | 'shopping' | 'culture'
  location: {
    name: string
    coordinates: [number, number]
    address: string
  }
  duration: number // 小时
  cost: number
  description: string
  rating?: number
  images?: string[]
}

export interface Accommodation {
  id: string
  name: string
  type: 'hotel' | 'hostel' | 'bnb' | 'apartment'
  location: {
    name: string
    coordinates: [number, number]
    address: string
  }
  cost: number
  rating?: number
  amenities: string[]
  images?: string[]
}

export interface Meal {
  id: string
  name: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  location: {
    name: string
    coordinates: [number, number]
    address: string
  }
  cost: number
  cuisine: string
  rating?: number
}

export interface Transportation {
  id: string
  type: 'flight' | 'train' | 'bus' | 'taxi' | 'subway' | 'walking'
  from: {
    name: string
    coordinates: [number, number]
  }
  to: {
    name: string
    coordinates: [number, number]
  }
  cost: number
  duration: number // 分钟
  description: string
}

export const useTravelStore = defineStore('travel', () => {
  const plans = ref<TravelPlan[]>([])
  const currentPlan = ref<TravelPlan | null>(null)
  const loading = ref(false)

  // 获取所有旅行计划
  const fetchPlans = async () => {
    loading.value = true
    try {
      const response = await api.get('/travel/plans')
      plans.value = response.data
    } catch (error) {
      console.error('获取旅行计划失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建新的旅行计划
  const createPlan = async (planData: Partial<TravelPlan>) => {
    loading.value = true
    try {
      const response = await api.post('/travel/plans', planData)
      const newPlan = response.data
      plans.value.push(newPlan)
      return newPlan
    } catch (error) {
      console.error('创建旅行计划失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新旅行计划
  const updatePlan = async (planId: string, planData: Partial<TravelPlan>) => {
    loading.value = true
    try {
      const response = await api.put(`/travel/plans/${planId}`, planData)
      const updatedPlan = response.data
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) {
        plans.value[index] = updatedPlan
      }
      if (currentPlan.value?.id === planId) {
        currentPlan.value = updatedPlan
      }
      return updatedPlan
    } catch (error) {
      console.error('更新旅行计划失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除旅行计划
  const deletePlan = async (planId: string) => {
    loading.value = true
    try {
      await api.delete(`/travel/plans/${planId}`)
      plans.value = plans.value.filter(p => p.id !== planId)
      if (currentPlan.value?.id === planId) {
        currentPlan.value = null
      }
    } catch (error) {
      console.error('删除旅行计划失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 设置当前计划
  const setCurrentPlan = (plan: TravelPlan | null) => {
    currentPlan.value = plan
  }

  return {
    plans,
    currentPlan,
    loading,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    setCurrentPlan
  }
})
