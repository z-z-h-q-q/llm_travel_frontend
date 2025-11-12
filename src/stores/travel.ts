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
      const rows = response.data || []
      // 归一化每一条计划，确保模板安全访问字段
      plans.value = rows.map((r: any) => normalizePlan(r))
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
      // POST to create plan can be long-running (backend Coze workflow).
      // Ensure this individual request uses a long timeout (5 minutes) so the browser
      // doesn't abort while backend finishes the workflow.
      const response = await api.post('/travel/plans', planData, { timeout: 300000 })
      const created = response.data
      const newPlan = normalizePlan(created)
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
      const updated = response.data
      const updatedPlan = normalizePlan(updated)
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

  // ---------- 数据归一化 helpers ----------
  const normalizeMeal = (m: any) => ({
    name: m?.name || '',
    description: m?.description || '',
    cost: typeof m?.cost === 'number' ? m.cost : Number(m?.cost) || 0
  })

  const normalizeAttraction = (a: any) => ({
    name: a?.name || '',
    address: a?.address || '',
    description: a?.description || '',
    ticket_price: typeof a?.ticket_price === 'number' ? a.ticket_price : Number(a?.ticket_price) || 0,
    estimated_visit_time: a?.estimated_visit_time || ''
  })

  const normalizeAccommodation = (acc: any) => ({
    name: acc?.name || '',
    address: acc?.address || '',
    cost: typeof acc?.cost === 'number' ? acc.cost : Number(acc?.cost) || 0
  })

  const normalizeDayPlan = (d: any) => ({
    day: d?.day || 0,
    date: d?.date || '',
    accommodation: normalizeAccommodation(d?.accommodation || {}),
    attractions: Array.isArray(d?.attractions) ? d.attractions.map((a: any) => normalizeAttraction(a)) : [],
    meals: {
      breakfast: normalizeMeal(d?.meals?.breakfast),
      lunch: normalizeMeal(d?.meals?.lunch),
      dinner: normalizeMeal(d?.meals?.dinner)
    }
  })

  const normalizePlan = (p: any): TravelPlan => ({
    id: p?.id || '',
    title: p?.title || '',
    basic_info: {
      departure: p?.basic_info?.departure || '',
      destination: p?.basic_info?.destination || '',
      travelers: p?.basic_info?.travelers || 0,
      startDate: p?.basic_info?.startDate || '',
      endDate: p?.basic_info?.endDate || '',
      days: p?.basic_info?.days || 0,
      preferences: Array.isArray(p?.basic_info?.preferences) ? p.basic_info.preferences : [],
      budget: typeof p?.basic_info?.budget === 'number' ? p.basic_info.budget : Number(p?.basic_info?.budget) || 0
    },
    destination_intro: {
      overview: p?.destination_intro?.overview || '',
      weather: p?.destination_intro?.weather || '',
      culture: p?.destination_intro?.culture || ''
    },
    daily_plan: Array.isArray(p?.daily_plan) ? p.daily_plan.map((d: any) => normalizeDayPlan(d)) : [],
    summary: {
      total_days: p?.summary?.total_days || 0,
      total_budget: {
        attractions: p?.summary?.total_budget?.attractions || 0,
        hotels: p?.summary?.total_budget?.hotels || 0,
        meals: p?.summary?.total_budget?.meals || 0,
        total: p?.summary?.total_budget?.total || 0
      },
      suggestions: Array.isArray(p?.summary?.suggestions) ? p.summary.suggestions : []
    },
    createdAt: p?.createdAt || p?.created_at || '',
    updatedAt: p?.updatedAt || p?.updated_at || ''
  })

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
