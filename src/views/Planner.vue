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
          <el-button @click="$router.push('/')" type="text">首页</el-button>
          <el-button @click="$router.push('/budget')" type="text">预算管理</el-button>
          <el-button @click="$router.push('/profile')" type="text">个人中心</el-button>
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
              <h4>{{ plan.title }}</h4>
              <p>{{ plan.basic_info.destination }}</p>
              <span class="date">{{ formatDate(plan.basic_info.startDate) }} - {{ formatDate(plan.basic_info.endDate) }}</span>
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
              <h2>{{ travelStore.currentPlan.title }}</h2>
              <div class="plan-info">
                <el-tag>{{ travelStore.currentPlan.basic_info.destination }}</el-tag>
                <el-tag type="success">{{ travelStore.currentPlan.basic_info.travelers }}人</el-tag>
                <el-tag type="warning">预算 ¥{{ travelStore.currentPlan.basic_info.budget }}</el-tag>
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
                        class="activity-item"
                      >
                        <div class="activity-info">
                          <h4>{{ attraction.name }}</h4>
                          <p>{{ attraction.description }}</p>
                          <div class="activity-meta">
                            <el-tag size="small">景点</el-tag>
                            <span class="duration">{{ attraction.estimated_visit_time }}</span>
                            <span class="cost">¥{{ attraction.ticket_price }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="住宿信息" name="accommodation">
                <div class="accommodation-list">
                  <div 
                    v-for="dayPlan in travelStore.currentPlan.daily_plan" 
                    :key="dayPlan.day"
                    v-if="dayPlan.accommodation"
                    class="accommodation-item"
                  >
                    <h4>{{ dayPlan.accommodation.name }}</h4>
                    <p>{{ dayPlan.accommodation.address }}</p>
                    <div class="accommodation-meta">
                      <el-tag>住宿</el-tag>
                      <span class="cost">¥{{ dayPlan.accommodation.cost }}/晚</span>
                    </div>
                  </div>
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
                      <div class="meal-item">
                        <span class="meal-type">早餐</span>
                        <div class="meal-info">
                          <p><strong>{{ dayPlan.meals.breakfast.name }}</strong></p>
                          <p>{{ dayPlan.meals.breakfast.description }}</p>
                          <span class="cost">¥{{ dayPlan.meals.breakfast.cost }}</span>
                        </div>
                      </div>
                      <div class="meal-item">
                        <span class="meal-type">午餐</span>
                        <div class="meal-info">
                          <p><strong>{{ dayPlan.meals.lunch.name }}</strong></p>
                          <p>{{ dayPlan.meals.lunch.description }}</p>
                          <span class="cost">¥{{ dayPlan.meals.lunch.cost }}</span>
                        </div>
                      </div>
                      <div class="meal-item">
                        <span class="meal-type">晚餐</span>
                        <div class="meal-info">
                          <p><strong>{{ dayPlan.meals.dinner.name }}</strong></p>
                          <p>{{ dayPlan.meals.dinner.description }}</p>
                          <span class="cost">¥{{ dayPlan.meals.dinner.cost }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 语音输入区域 -->
          <div class="voice-section">
            <el-card>
              <div class="voice-input">
                <el-button 
                  :type="isListening ? 'danger' : 'primary'" 
                  :icon="isListening ? 'Microphone' : 'Microphone'" 
                  size="large"
                  circle
                  @click="toggleVoiceInput"
                  :loading="isProcessing"
                >
                  {{ isListening ? '停止录音' : '语音输入' }}
                </el-button>
                <p class="voice-hint">{{ isListening ? '正在听取您的需求...' : '点击开始语音输入' }}</p>
              </div>
              
              <div v-if="voiceText" class="voice-result">
                <p><strong>识别结果：</strong>{{ voiceText }}</p>
                <el-button @click="processVoiceInput" type="primary" :loading="isProcessing">
                  更新行程
                </el-button>
              </div>
            </el-card>
          </div>
        </main>
      </div>
    </div>

    <!-- 创建计划对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新的旅行计划" width="600px">
      <el-form :model="newPlanForm" label-width="100px">
        <el-form-item label="计划名称">
          <el-input v-model="newPlanForm.title" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="目的地">
          <el-input v-model="newPlanForm.basic_info.destination" placeholder="请输入目的地" />
        </el-form-item>
        <el-form-item label="出发地">
          <el-input v-model="newPlanForm.basic_info.departure" placeholder="请输入出发地" />
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker v-model="newPlanForm.basic_info.startDate" type="date" />
        </el-form-item>
        <el-form-item label="返回日期">
          <el-date-picker v-model="newPlanForm.basic_info.endDate" type="date" />
        </el-form-item>
        <el-form-item label="同行人数">
          <el-input-number v-model="newPlanForm.basic_info.travelers" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="预算">
          <el-input-number v-model="newPlanForm.basic_info.budget" :min="0" />
        </el-form-item>
        <el-form-item label="旅行偏好">
          <el-checkbox-group v-model="newPlanForm.basic_info.preferences">
            <el-checkbox label="美食">美食</el-checkbox>
            <el-checkbox label="文化">文化</el-checkbox>
            <el-checkbox label="自然">自然</el-checkbox>
            <el-checkbox label="购物">购物</el-checkbox>
            <el-checkbox label="娱乐">娱乐</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPlan" :loading="travelStore.loading">
          创建计划
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTravelStore } from '@/stores/travel'
import { speechRecognition, speechSynthesis } from '@/utils/speech'
import { mapService } from '@/utils/map'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const travelStore = useTravelStore()

const activeTab = ref('itinerary')
const showCreateDialog = ref(false)
const isListening = ref(false)
const isProcessing = ref(false)
const voiceText = ref('')

const newPlanForm = ref({
  title: '',
  basic_info: {
    destination: '',
    departure: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: 0,
    days: 0,
    preferences: []
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

// 选择计划
const selectPlan = (plan: any) => {
  travelStore.setCurrentPlan(plan)
  // 在地图上显示计划
  displayPlanOnMap(plan)
}

// 在地图上显示计划
const displayPlanOnMap = (plan: any) => {
  if (!plan) return
  
  // 清除之前的标记
  mapService.clearMarkers()
  mapService.clearRoutes()
  
  // 添加活动地点标记
  plan.daily_plan.forEach((dayPlan: any) => {
    dayPlan.attractions.forEach((attraction: any) => {
      mapService.addMarker([attraction.location.longitude, attraction.location.latitude], {
        title: attraction.name,
        content: attraction.description
      })
    })
  })
}

// 切换语音输入
const toggleVoiceInput = () => {
  if (isListening.value) {
    speechRecognition.stopListening()
    isListening.value = false
  } else {
    speechRecognition.startListening(
      (text) => {
        voiceText.value = text
        isListening.value = false
        ElMessage.success('语音识别成功')
      },
      (error) => {
        ElMessage.error(`语音识别失败: ${error}`)
        isListening.value = false
      }
    )
    isListening.value = true
  }
}

// 处理语音输入
const processVoiceInput = async () => {
  if (!voiceText.value) {
    ElMessage.warning('请先进行语音输入')
    return
  }

  isProcessing.value = true
  try {
    // 这里可以调用AI API处理语音输入并更新行程
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('行程已更新')
  } catch (error) {
    ElMessage.error('处理失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

// 创建计划
const createPlan = async () => {
  if (!newPlanForm.value.title || !newPlanForm.value.basic_info.destination) {
    ElMessage.warning('请填写必要信息')
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

    const plan = await travelStore.createPlan(newPlanForm.value)
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
const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}

onMounted(async () => {
  // 初始化地图
  await mapService.initMap()
  const map = mapService.createMap('map', {
    center: [116.397428, 39.90923],
    zoom: 10
  })

  // 加载用户的旅行计划
  await travelStore.fetchPlans()
})

onUnmounted(() => {
  // 清理资源
  speechRecognition.stopListening()
})
</script>

<style scoped lang="scss">
.planner-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
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
  }
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 300px;
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
    overflow-y: auto;
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
  overflow: hidden;
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
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;

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

    :deep(.el-tabs__content) {
      flex: 1;
      overflow-y: auto;
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

.voice-section {
  margin-top: 1rem;

  .voice-input {
    text-align: center;
    padding: 1rem;

    .voice-hint {
      margin-top: 1rem;
      color: #666;
    }
  }

  .voice-result {
    margin-top: 1rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 0.5rem;

    p {
      margin: 0 0 1rem 0;
    }
  }
}

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
