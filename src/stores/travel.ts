import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface BasicInfo {
  departure: string
  destination: string
  travelers: number
  startDate: string
  endDate: string
  days: number
  preferences: string[]
  budget: number
}

export interface DestinationIntro {
  overview: string
  weather: string
  culture: string
}

export interface Attraction {
  name: string
  address: string
  description: string
  ticket_price: number
  estimated_visit_time: string
}

export interface Accommodation {
  name: string
  address: string
  cost: number
}

export interface MealInfo {
  name: string
  description: string
  cost: number
}

export interface DayMeals {
  breakfast: MealInfo
  lunch: MealInfo
  dinner: MealInfo
}

export interface DayPlan {
  day: number
  date: string
  accommodation: Accommodation
  attractions: Attraction[]
  meals: DayMeals
}

export interface TotalBudget {
  attractions: number
  hotels: number
  meals: number
  total: number
}

export interface Summary {
  total_days: number
  total_budget: TotalBudget
  suggestions: string[]
}

export interface TravelPlan {
  id: string
  title: string
  basic_info: BasicInfo
  destination_intro: DestinationIntro
  daily_plan: DayPlan[]
  summary: Summary
  createdAt: string
  updatedAt: string
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
