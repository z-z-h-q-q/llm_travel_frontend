<template>
  <div class="planner-page">
    <!-- 头部导航 -->
    <header class="header">
      <div class="container">
        <div class="logo">
          <el-icon><Location /></el-icon>
          <span>AI旅行规划师</span>
        </div>
        <nav class="nav">
          <el-button @click="$router.push('/')" type="text" :class="{ 'is-active': route.path === '/' }">首页</el-button>
          <el-button @click="$router.push('/planner')" type="text" :class="{ 'is-active': route.path.startsWith('/planner') }">行程规划</el-button>
          <el-button @click="$router.push('/profile')" type="text" :class="{ 'is-active': route.path.startsWith('/profile') }">个人中心</el-button>
          <el-button @click="handleLogout" type="text">退出</el-button>
        </nav>
      </div>
    </header>

    <div class="main-content">
      <div class="container">
        <!-- 侧边栏 -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h3>我的旅行计划</h3>
            <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
              新建计划
            </el-button>
          </div>
          
          <div class="plan-list">
            <div 
              v-for="plan in travelStore.plans" 
              :key="plan.id"
              class="plan-item"
              :class="{ active: travelStore.currentPlan?.id === plan.id }"
              @click="selectPlan(plan)"
            >
              <h4>{{ plan.title || '未命名计划' }}</h4>
              <p>{{ plan.basic_info?.destination || '' }}</p>
              <span class="date">{{ formatDate(plan.basic_info?.startDate) }} - {{ formatDate(plan.basic_info?.endDate) }}</span>
              <span style="margin-left:8px" v-if="planCenterLoading === `plan_center||${plan.id || plan.basic_info?.destination}`"><el-icon><Loading /></el-icon></span>
            </div>
          </div>
        </aside>

        <!-- 主内容区域 -->
        <main class="content">
          <!-- 地图区域 -->
          <div class="map-container">
            <div id="map" class="map"></div>
          </div>

          <!-- 行程详情 -->
          <div class="itinerary-details" v-if="travelStore.currentPlan">
            <div class="details-header">
              <h2>{{ travelStore.currentPlan?.title || '未命名计划' }}</h2>
              <div class="plan-info">
                <el-tag>{{ travelStore.currentPlan?.basic_info?.destination || '' }}</el-tag>
                <el-tag type="success">{{ travelStore.currentPlan?.basic_info?.travelers || 0 }}人</el-tag>
                <el-tag type="warning">预算 ¥{{ travelStore.currentPlan?.basic_info?.budget || 0 }}</el-tag>
              </div>
            </div>

            <el-tabs v-model="activeTab" class="itinerary-tabs">
              <el-tab-pane label="行程安排" name="itinerary">
                <div class="day-plans">
                  <div 
                    v-for="dayPlan in travelStore.currentPlan.daily_plan" 
                    :key="dayPlan.day"
                    class="day-plan"
                  >
                    <div class="day-header">
                      <h3>第{{ dayPlan.day }}天</h3>
                      <span class="date">{{ formatDate(dayPlan.date) }}</span>
                    </div>
                    
                    <div class="activities">
                      <div 
                        v-for="(attraction, index) in dayPlan.attractions" 
                        :key="index"
                        class="activity-item clickable"
                        @click.stop="onAttractionClick(attraction)"
                      >
                        <div class="activity-info">
                          <h4 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span>{{ attraction?.name || '景点' }}</span>
                            <span v-if="loadingKey === makeItemKey(attraction,'attraction')"><el-icon><Loading /></el-icon></span>
                          </h4>
                          <p>{{ attraction?.description || '' }}</p>
                          <div class="activity-meta">
                            <el-tag size="small">景点</el-tag>
                            <span class="duration">{{ attraction?.estimated_visit_time || '' }}</span>
                            <span class="cost">¥{{ attraction?.ticket_price ?? 0 }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="住宿信息" name="accommodation">
                <div class="accommodation-list">
                      <template v-for="dayPlan in travelStore.currentPlan?.daily_plan">
                        <div v-if="dayPlan.accommodation" :key="dayPlan.day" class="activity-item clickable" :class="{ 'active-item': highlightedKey === makeItemKey(dayPlan.accommodation, 'hotel') }" @click.stop="onAccommodationClick(dayPlan.accommodation)">
                          <div class="activity-info">
                            <h4 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                              <span>{{ dayPlan.accommodation.name }}</span>
                              <span v-if="loadingKey === makeItemKey(dayPlan.accommodation,'hotel')"><el-icon><Loading /></el-icon></span>
                            </h4>
                            <p>{{ dayPlan.accommodation.address }}</p>
                            <div class="activity-meta">
                              <el-tag size="small">住宿</el-tag>
                              <span class="cost">¥{{ dayPlan.accommodation.cost }}/晚</span>
                            </div>
                          </div>
                        </div>
                      </template>
                </div>
              </el-tab-pane>

              <el-tab-pane label="餐饮信息" name="meals">
                <div class="meals-list">
                  <div 
                    v-for="dayPlan in travelStore.currentPlan.daily_plan" 
                    :key="dayPlan.day"
                    class="day-meals"
                  >
                    <h4>第{{ dayPlan.day }}天餐饮</h4>
                    <div class="meal-items">
                      <div class="activity-item clickable" :class="{ 'active-item': highlightedKey === makeItemKey(dayPlan.meals?.breakfast, 'restaurant') }" @click.stop="onMealClick(dayPlan.meals?.breakfast, 'breakfast')">
                        <div class="activity-info">
                          <h4 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span>{{ dayPlan.meals?.breakfast?.name || '—' }}</span>
                            <span v-if="loadingKey === makeItemKey(dayPlan.meals?.breakfast,'restaurant')"><el-icon><Loading /></el-icon></span>
                          </h4>
                          <p>{{ dayPlan.meals?.breakfast?.description || '' }}</p>
                          <div class="activity-meta">
                            <el-tag size="small">早餐</el-tag>
                            <span class="cost">¥{{ dayPlan.meals?.breakfast?.cost || 0 }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="activity-item clickable" :class="{ 'active-item': highlightedKey === makeItemKey(dayPlan.meals?.lunch, 'restaurant') }" @click.stop="onMealClick(dayPlan.meals?.lunch, 'lunch')">
                        <div class="activity-info">
                          <h4 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span>{{ dayPlan.meals?.lunch?.name || '—' }}</span>
                            <span v-if="loadingKey === makeItemKey(dayPlan.meals?.lunch,'restaurant')"><el-icon><Loading /></el-icon></span>
                          </h4>
                          <p>{{ dayPlan.meals?.lunch?.description || '' }}</p>
                          <div class="activity-meta">
                            <el-tag size="small">午餐</el-tag>
                            <span class="cost">¥{{ dayPlan.meals?.lunch?.cost || 0 }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="activity-item clickable" :class="{ 'active-item': highlightedKey === makeItemKey(dayPlan.meals?.dinner, 'restaurant') }" @click.stop="onMealClick(dayPlan.meals?.dinner, 'dinner')">
                        <div class="activity-info">
                          <h4 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span>{{ dayPlan.meals?.dinner?.name || '—' }}</span>
                            <span v-if="loadingKey === makeItemKey(dayPlan.meals?.dinner,'restaurant')"><el-icon><Loading /></el-icon></span>
                          </h4>
                          <p>{{ dayPlan.meals?.dinner?.description || '' }}</p>
                          <div class="activity-meta">
                            <el-tag size="small">晚餐</el-tag>
                            <span class="cost">¥{{ dayPlan.meals?.dinner?.cost || 0 }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

        </main>
      </div>
    </div>

    <!-- 创建计划对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新的旅行计划" width="600px">
      <el-form :model="newPlanForm" label-width="100px">
        <!-- 与 Home.vue 保持一致的表单布局 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出发地">
              <el-input v-model="newPlanForm.basic_info.departure" placeholder="请输入出发地" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的地">
              <el-input v-model="newPlanForm.basic_info.destination" placeholder="请输入目的地" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="旅行日期">
              <div style="display: flex; align-items: center; gap: 10px;">
                <el-date-picker
                  v-model="newPlanForm.basic_info.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="flex: 1;"
                  value-format="YYYY-MM-DD"
                  @change="calculateTravelDays"
                />
                <div class="travel-days" style="color: #606266; min-width: 80px; text-align: left;">
                  旅行天数: {{ travelDays }} 天
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算">
              <el-input-number v-model="newPlanForm.basic_info.budget" :min="0" style="width: 100%" :step="1000" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="旅行偏好">
              <el-select
                  v-model="newPlanForm.basic_info.preferences"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或输入偏好"
                  style="width: 100%"
                >
                  <el-option v-for="opt in preferenceOptions" :key="opt" :label="opt" :value="opt" />
                </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="同行人数">
              <el-input-number v-model="newPlanForm.basic_info.travelers" :min="1" :max="20" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPlan" :loading="travelStore.loading">
          创建计划
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 物品详情对话框（由信息窗的“查看详情”触发） -->
    <el-dialog v-model="detailDialogVisible" title="地点详情" width="480px">
      <div v-if="detailItem">
        <h3>{{ detailItem.item?.name || detailItem.name || '详情' }}</h3>
        <p style="color:#666">{{ detailItem.item?.description || detailItem.description || detailItem.item?.address || '' }}</p>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTravelStore } from '@/stores/travel'
// Element Plus icons used in this view
import { Plus, Location, Loading } from '@element-plus/icons-vue'
import { mapService } from '@/utils/map'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const travelStore = useTravelStore()

const activeTab = ref('itinerary')
const showCreateDialog = ref(false)
const highlightedKey = ref('')
const loadingKey = ref('')
const planCenterLoading = ref('')
// 语音输入相关已移除，保留页面主要状态

const newPlanForm = ref({
  basic_info: {
    destination: '',
    departure: '',
    startDate: '',
    endDate: '',
    // dateRange 用于和 Home.vue 保持一致的日期范围选择器绑定
    dateRange: [] as any,
    travelers: 1,
    budget: 0,
    days: 0,
    preferences: Array.isArray(userStore.preferences) ? [...(userStore.preferences as any)] : []
  },
  destination_intro: {
    overview: '',
    weather: '',
    culture: ''
  },
  daily_plan: [],
  summary: {
    total_days: 0,
    total_budget: {
      attractions: 0,
      hotels: 0,
      meals: 0,
      total: 0
    },
    suggestions: []
  }
})

// 偏好选项：默认 + 用户已保存的偏好（去重）
const preferenceOptions = computed(() => {
  const defaults = ['美食','文化','自然','购物','娱乐','历史','艺术','运动']
  const userPrefs = Array.isArray(userStore.preferences) ? (userStore.preferences as any) : []
  return Array.from(new Set([...defaults, ...userPrefs]))
})

// 当创建对话框打开时，预填用户已保存的偏好
watch(showCreateDialog, (val) => {
  if (val) {
    newPlanForm.value.basic_info.preferences = Array.isArray(userStore.preferences) ? [...(userStore.preferences as any)] : []
  }
})

// 与 Home.vue 一致：显示并计算旅行天数
const travelDays = ref(0)

const calculateTravelDays = () => {
  const dr = newPlanForm.value.basic_info.dateRange
  if (dr && Array.isArray(dr) && dr.length === 2) {
    const startDate = new Date(dr[0])
    const endDate = new Date(dr[1])
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    travelDays.value = diffDays + 1
    newPlanForm.value.basic_info.startDate = dr[0]
    newPlanForm.value.basic_info.endDate = dr[1]
    newPlanForm.value.basic_info.days = travelDays.value
  } else {
    travelDays.value = 0
  }
}

// 选择计划：先定位到目的地城市中心并显示 loading，再加载计划细节并显示在地图上
const selectPlan = async (plan: any) => {
  if (!plan) return
  travelStore.setCurrentPlan(plan)
  const dest = plan.basic_info?.destination || ''
  const centerKey = `plan_center||${plan.id || dest}`
  planCenterLoading.value = centerKey
  let centerPos: [number, number] | null = null
  try {
    // 尝试通过 POI 搜索解析城市中心
    if (dest) {
      const places = await mapService.searchPlaces(dest, dest)
      if (Array.isArray(places) && places.length > 0) {
        const p = places[0]
        const loc = p.location ?? p.loc ?? p.geometry ?? null
        let pos = null
        if (loc) {
          if (typeof loc === 'string') {
            const [lngS, latS] = loc.split(',')
            const lng = parseFloat(lngS)
            const lat = parseFloat(latS)
            if (!isNaN(lng) && !isNaN(lat)) pos = [lng, lat]
          } else if (typeof loc === 'object') {
            const lng = loc.lng ?? loc.longitude ?? loc.lon ?? loc.x
            const lat = loc.lat ?? loc.latitude ?? loc.y
            const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng
            const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
            if (typeof lngNum === 'number' && !isNaN(lngNum) && typeof latNum === 'number' && !isNaN(latNum)) pos = [lngNum, latNum]
          }
        }
        if (!pos) {
          const lng2 = p.lng ?? p.longitude ?? p.lon ?? p.x
          const lat2 = p.lat ?? p.latitude ?? p.y
          const lngNum2 = typeof lng2 === 'string' ? parseFloat(lng2) : lng2
          const latNum2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2
          if (typeof lngNum2 === 'number' && !isNaN(lngNum2) && typeof latNum2 === 'number' && !isNaN(latNum2)) pos = [lngNum2, latNum2]
        }
        if (pos) {
          centerPos = pos
          try { mapService.clearMarkers(); mapService.clearRoutes(); } catch(e){}
          mapService.zoomToPosition(pos, 11)
        }
      }
    }
  } catch (e) {
    console.warn('selectPlan center search failed', e)
  } finally {
    planCenterLoading.value = ''
  }

  // 创建占位预览标记（如果解析到中心点）
  try {
    mapService.clearPlaceholders && mapService.clearPlaceholders()
    if (centerPos) {
      // 收集 plan 中所有条目并放置占位（先在中心附近排列）
      const items: Array<{ item: any, type: string }>= []
      const days = Array.isArray(plan.daily_plan) ? plan.daily_plan : []
      for (const dayPlan of days) {
        if (dayPlan.accommodation) items.push({ item: dayPlan.accommodation, type: 'hotel' })
        const attractions = Array.isArray(dayPlan.attractions) ? dayPlan.attractions : []
        for (const a of attractions) items.push({ item: a, type: 'attraction' })
        const meals = dayPlan?.meals || {}
        for (const mealType of ['breakfast','lunch','dinner']) {
          const m = meals[mealType]
          if (m) items.push({ item: m, type: 'restaurant' })
        }
      }
      // 放置占位：在中心附近做小偏移以避免完全重叠
      for (let i=0;i<items.length;i++) {
        const off = 0.004 * (Math.floor(i/5)+1)
        const dx = (i%5 - 2) * 0.002
        const pos = [centerPos[0] + dx + off*0, centerPos[1] + (Math.floor(i/5)-1)*0.002]
        const key = makeItemKey(items[i].item, items[i].type)
        try { mapService.addPlaceholderMarker && mapService.addPlaceholderMarker(pos, { type: items[i].type, title: items[i].item?.name || items[i].item?.title || '', key }) } catch(e){}
      }
    }
  } catch (e) {
    console.warn('create placeholders failed', e)
  }

  // 在地图上显示计划（异步）
  await displayPlanOnMap(plan)
  // displayPlanOnMap 会清除所有标记与路线；如果解析到了城市中心，在此处添加一个简单的城市标记
  try {
    if (centerPos) {
      try { mapService.clearMarkers(); mapService.clearRoutes(); } catch(e){}
      // 添加城市标记（不显示文字，仅作为视觉锚点）
      try {
        const cityMarker = mapService.addMarker(centerPos, { type: 'city' })
        // 不自动打开信息窗，只在用户点击标记时显示（信息窗内容不包含强制文字）
        if (cityMarker) {
          const content = `<div style="min-width:120px"><strong>${dest || ''}</strong></div>`
          try { mapService.addInfoWindowWithActions(cityMarker, content, { item: { name: dest }, pos: centerPos }) } catch(e){}
        }
      } catch (e) {
        // 忽略添加城市标记错误
      }
    }
  } catch (e) {
    console.warn('添加城市标记失败', e)
  }
  // 默认展示与当前 tab 对应的标记类型
  updateMapMarkersForTab(activeTab.value)
}

// 根据 tab 显示对应类型的标记
const updateMapMarkersForTab = (tabName: string) => {
  switch (tabName) {
    case 'itinerary':
      mapService.showMarkersByType(['attraction'])
      // 放大到第一个景点（如果有）
      const attractionMarkers = mapService.getMarkersByType(['attraction'])
      if (attractionMarkers.length > 0) {
        try { const p = attractionMarkers[0].getPosition(); mapService.zoomToPosition([p.lng, p.lat], 14) } catch (e) {}
      }
      break
    case 'accommodation':
      mapService.showMarkersByType(['hotel'])
      const hotelMarkers = mapService.getMarkersByType(['hotel'])
      if (hotelMarkers.length > 0) {
        try { const p = hotelMarkers[0].getPosition(); mapService.zoomToPosition([p.lng, p.lat], 14) } catch (e) {}
      }
      break
    case 'meals':
      mapService.showMarkersByType(['restaurant'])
      const restMarkers = mapService.getMarkersByType(['restaurant'])
      if (restMarkers.length > 0) {
        try { const p = restMarkers[0].getPosition(); mapService.zoomToPosition([p.lng, p.lat], 14) } catch (e) {}
      }
      break
    default:
      mapService.showMarkersByType([])
  }
}

// 监听 tab 切换
watch(activeTab, (val) => {
  updateMapMarkersForTab(val)
})

// 在地图上显示计划
const displayPlanOnMap = async (plan: any) => {
  if (!plan) return

  try {
    // 不在地图上自动显示景点/住宿/餐厅标记
    // 按用户要求，地图在选择计划后保持空白（仅居中到目的地），
    // 只有在用户点击下方卡片时才会跳转并显示该位置。
    try { mapService.clearMarkers() } catch (e) {}
    try { mapService.clearRoutes() } catch (e) {}
  } catch (e) {
    console.warn('displayPlanOnMap failed', e)
  }
}

// 点击单个条目时，在地图上显示并放大到该位置
const showItemOnMap = async (item: any, type: string) => {
  if (!item) return
  // 1) 优先使用已有坐标
  let pos: [number, number] | null = null
  try {
    if (item.location && typeof item.location.longitude === 'number' && typeof item.location.latitude === 'number') {
      pos = [item.location.longitude, item.location.latitude]
    } else if (item.lng && item.lat) {
      const lng = typeof item.lng === 'string' ? parseFloat(item.lng) : item.lng
      const lat = typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat
      if (!isNaN(lng) && !isNaN(lat)) pos = [lng, lat]
    }
  } catch (e) {
    // ignore
  }

  // 2) 如果没有坐标，尝试通过 name 搜索 POI
  if (!pos && item.name) {
    const places = await mapService.searchPlaces(item.name, travelStore.currentPlan?.basic_info?.destination || '')
    if (Array.isArray(places) && places.length > 0) {
      const p = places[0]
      const loc = p.location ?? p.loc ?? p.geometry ?? null
      if (loc) {
        if (typeof loc === 'string') {
          const [lngS, latS] = loc.split(',')
          const lng = parseFloat(lngS)
          const lat = parseFloat(latS)
          if (!isNaN(lng) && !isNaN(lat)) pos = [lng, lat]
        } else if (typeof loc === 'object') {
          const lng = loc.lng ?? loc.longitude ?? loc.lon ?? loc.x
          const lat = loc.lat ?? loc.latitude ?? loc.y
          const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng
          const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
          if (typeof lngNum === 'number' && !isNaN(lngNum) && typeof latNum === 'number' && !isNaN(latNum)) pos = [lngNum, latNum]
        }
      }
      // fallback 顶层 lng/lat
      if (!pos) {
        const lng2 = p.lng ?? p.longitude ?? p.lon ?? p.x
        const lat2 = p.lat ?? p.latitude ?? p.y
        const lngNum2 = typeof lng2 === 'string' ? parseFloat(lng2) : lng2
        const latNum2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2
        if (typeof lngNum2 === 'number' && !isNaN(lngNum2) && typeof latNum2 === 'number' && !isNaN(latNum2)) pos = [lngNum2, latNum2]
      }
    }
  }

  if (!pos) {
    ElMessage.warning('无法定位该地点，请确保名称准确或在后端补充坐标')
    return
  }

  // 在地图上添加标记并放大
  try {
    // 点击时只显示当前选中位置：清除其他标记与路线
    try { mapService.clearMarkers() } catch (e) {}
    try { mapService.clearRoutes() } catch (e) {}
    const marker = mapService.addMarker(pos, { type: type === 'hotel' ? 'hotel' : type === 'restaurant' ? 'restaurant' : 'attraction', title: item.name || item.title || '' })
    if (marker) {
      const content = `<div style="min-width:140px"><strong>${item.name || item.title || ''}</strong><div style='margin-top:6px;font-size:12px;color:#666'>${item.description || item.address || ''}</div></div>`
      try {
        const infoWin = mapService.addInfoWindowWithActions(marker, content, { item, pos })
        // 点击卡片时直接打开信息窗，方便用户看到详情与导航操作
        try { if (infoWin && typeof infoWin.open === 'function') infoWin.open(mapService.getMap(), marker.getPosition()) } catch (err) {}
      } catch (e) {}
    }
    mapService.zoomToPosition(pos, 15)
  } catch (e) {
    console.warn('showItemOnMap failed', e)
  }
}

const makeItemKey = (item: any, type: string) => {
  if (!item) return ''
  // 优先使用后端返回的唯一 id（支持多种命名）
  const id = item.id ?? item.uid ?? item._id ?? item.sid ?? null
  if (id) return `${type}||id:${id}`
  // 回退到 name+addr 组合
  const name = item.name || item.title || ''
  const addr = item.address || item.description || ''
  return `${type}||${name}||${addr}`
}

const onAttractionClick = async (attraction: any) => {
  const key = makeItemKey(attraction, 'attraction')
  highlightedKey.value = key
  loadingKey.value = key
  try {
    await showItemOnMap(attraction, 'attraction')
  } finally {
    loadingKey.value = ''
  }
}

const onAccommodationClick = async (accom: any) => {
  const key = makeItemKey(accom, 'hotel')
  highlightedKey.value = key
  loadingKey.value = key
  try {
    await showItemOnMap(accom, 'hotel')
  } finally {
    loadingKey.value = ''
  }
}

const onMealClick = async (meal: any, mealType: string) => {
  const key = makeItemKey(meal, 'restaurant')
  highlightedKey.value = key
  loadingKey.value = key
  try {
    await showItemOnMap(meal, 'restaurant')
  } finally {
    loadingKey.value = ''
  }
}

// 语音输入功能已移除，保持页面简洁

// 创建计划
const createPlan = async () => {
  // 与 Home.vue 保持一致：只发送 basic_info，title 由后端生成
  if (!newPlanForm.value.basic_info.destination || !newPlanForm.value.basic_info.startDate || !newPlanForm.value.basic_info.endDate) {
    ElMessage.warning('请填写必要信息（目的地与完整日期）')
    return
  }

  try {
    // 计算旅行天数
    if (newPlanForm.value.basic_info.startDate && newPlanForm.value.basic_info.endDate) {
      const startDate = new Date(newPlanForm.value.basic_info.startDate as any)
      const endDate = new Date(newPlanForm.value.basic_info.endDate as any)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      newPlanForm.value.basic_info.days = diffDays + 1
    }

    // 更新 summary 中的总天数和总预算
    newPlanForm.value.summary.total_days = newPlanForm.value.basic_info.days
    newPlanForm.value.summary.total_budget.total = newPlanForm.value.basic_info.budget

    const payload = {
      basic_info: {
        departure: newPlanForm.value.basic_info.departure,
        destination: newPlanForm.value.basic_info.destination,
        startDate: newPlanForm.value.basic_info.startDate,
        endDate: newPlanForm.value.basic_info.endDate,
        days: newPlanForm.value.basic_info.days,
        budget: newPlanForm.value.basic_info.budget,
        travelers: newPlanForm.value.basic_info.travelers,
        preferences: newPlanForm.value.basic_info.preferences || []
      }
    }

    // 持久化用户在此处选择的旅行偏好到 user store（本地存储）
    try {
      userStore.setPreferences(newPlanForm.value.basic_info.preferences || [])
    } catch (e) {
      // ignore
    }

    const plan = await travelStore.createPlan(payload)
    travelStore.setCurrentPlan(plan)
    showCreateDialog.value = false
    ElMessage.success('计划创建成功')
  } catch (error) {
    ElMessage.error('创建失败，请重试')
  }
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

// 格式化日期
const formatDate = (date: string | null | undefined) => {
  if (!date) return ''
  return dayjs(date).format('MM-DD')
}

onMounted(async () => {
  // 初始化地图（若缺少 key 或加载失败，会在 UI 上提示）
  try {
    await mapService.initMap()
    const map = mapService.createMap('map', {
      center: [116.397428, 39.90923],
      zoom: 10
    })
  } catch (e) {
    // 清晰提示高德 key 问题
    console.error('地图初始化失败:', e)
    ElMessage.error(e?.message || '地图初始化失败，请检查 VITE_AMAP_KEY 是否已配置')
  }

  // 加载用户的旅行计划
  await travelStore.fetchPlans()
})

// 详情弹窗与事件监听
const detailDialogVisible = ref(false)
const detailItem = ref<any>(null)

const _onMapItemDetails = (e: any) => {
  detailItem.value = e?.detail || null
  detailDialogVisible.value = true
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('map:item:details', _onMapItemDetails)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('map:item:details', _onMapItemDetails)
  }
})

const handleDialogNavigate = async () => {
  // 已移除卡片内导航功能：详情对话框仅展示信息，导航请在信息窗的“查看详情”中使用高德跳转
  return
}


// 没有需要在卸载时清理的语音监听资源
</script>

<style scoped lang="scss">
.planner-page {
  /* allow the whole page to grow and scroll when content is tall */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: visible;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }

  .nav {
    display: flex;
    gap: 1rem;

    .el-button.is-active {
      text-decoration: underline;
      text-decoration-color: #409eff;
      text-underline-offset: 4px;
      color: #409eff;
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  /* let the page (outer) handle scrolling so the whole page scrolls */
  overflow: visible;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  width: 100%;
  height: auto;
}

.main-content > .container {
  /* allow flex children to shrink and enable inner scrolling (fix flex overflow issues) */
  min-height: 0;
}

.sidebar {
  width: 300px;
  /* 顶部留白，避免与头部紧贴 */
  margin-top: 1rem;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 1.2rem;
    }
  }

  .plan-list {
    flex: 1;
    /* let the whole page scroll instead of sidebar having its own scrollbar */
    overflow: visible;
    padding: 1rem;

    .plan-item {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid transparent;

      &:hover {
        background: #f5f5f5;
      }

      &.active {
        background: #e3f2fd;
        border-color: #2196f3;
      }

      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
      }

      p {
        margin: 0 0 0.5rem 0;
        color: #666;
        font-size: 0.9rem;
      }

      .date {
        font-size: 0.8rem;
        color: #999;
      }
    }
  }
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* let outer page scroll; avoid inner scrollbars */
  overflow: visible;
}

.map-container {
  height: 400px;
  margin-bottom: 1rem;

  .map {
    width: 100%;
    height: 100%;
    border-radius: 0.5rem;
  }
}

.itinerary-details {
  flex: 1;
  /* 左侧留白，和侧边栏/地图保持一定间距 */
  margin-left: 1rem;
  background: white;
  border-radius: 0.5rem;
  /* let outer page scroll; content will expand naturally */
  overflow: visible;

  .details-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .plan-info {
      display: flex;
      gap: 0.5rem;
    }
  }

  .itinerary-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
    margin-left: 15px;

    :deep(.el-tabs__content) {
      flex: 1;
      /* let outer page handle scrolling */
      overflow: visible;
    }
  }
}

.day-plans {
  padding: 1rem;

  .day-plan {
    margin-bottom: 2rem;
    border: 1px solid #e0e0e0;
    border-radius: 0.5rem;
    overflow: hidden;

    .day-header {
      background: #f5f5f5;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 1.2rem;
      }

      .date {
        color: #666;
      }
    }

    .activities {
      padding: 1rem;

      .activity-item {
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;

        &.clickable {
          cursor: pointer;
        }

        &.active-item {
          background: #e3f2fd;
          border-color: #2196f3;
        }

        &:last-child {
          border-bottom: none;
        }

        .activity-info {
          h4 {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
          }

          p {
            margin: 0 0 1rem 0;
            color: #666;
            line-height: 1.5;
          }

          .activity-meta {
            display: flex;
            gap: 1rem;
            align-items: center;

            .duration, .cost {
              color: #666;
              font-size: 0.9rem;
            }
          }
        }
      }
    }
  }
}

.accommodation-list, .transportation-list, .meals-list {
  padding: 1rem;

  /* 让 accommodation/meals 中的 activity-item 使用与行程中相同的样式 */
  .activity-item {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;

    &.clickable {
      cursor: pointer;
    }

    &:last-child {
      border-bottom: none;
    }

    .activity-info {
      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
      }

      p {
        margin: 0 0 1rem 0;
        color: #666;
        line-height: 1.5;
      }

      .activity-meta {
        display: flex;
        gap: 1rem;
        align-items: center;

        .duration, .cost {
          color: #666;
          font-size: 0.9rem;
        }
      }
    }
    &.active-item {
      background: #e3f2fd;
      border-color: #2196f3;
    }
  }

  .accommodation-item, .transport-item {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 0.5rem;
    margin-bottom: 1rem;

    h4 {
      margin: 0 0 0.5rem 0;
    }

    p {
      margin: 0 0 1rem 0;
      color: #666;
    }

    .accommodation-meta, .transport-meta {
      display: flex;
      gap: 1rem;
      align-items: center;

      .cost {
        color: #666;
        font-size: 0.9rem;
      }
    }
  }

  .day-meals {
    margin-bottom: 2rem;

    h4 {
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 0.5rem;
      margin: 0 0 1rem 0;
    }

    .meal-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .meal-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;

      .meal-type {
        min-width: 60px;
        font-weight: bold;
        color: #333;
        display: flex;
        align-items: center;
      }

      .meal-info {
        flex: 1;

        p {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;

          &:first-child {
            font-weight: bold;
            font-size: 1rem;
          }
        }

        .cost {
          color: #ff6b6b;
          font-weight: bold;
        }
      }
    }
  }
}

/* 语音输入样式已移除 */

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 200px;
  }

  .content {
    height: calc(100vh - 200px);
  }
}
</style>
