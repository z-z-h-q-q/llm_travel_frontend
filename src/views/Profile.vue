<template>
  <div class="profile-page">
    <!-- 头部导航 -->
    <header class="header">
      <div class="container">
        <div class="logo">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
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
        <!-- 用户信息卡片 -->
        <section class="user-info">
          <el-card>
            <div class="user-card">
              <div class="avatar-section">
                <el-avatar :size="80" :src="userStore.user?.avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
              </div>
              <div class="user-details">
                <h2>{{ userStore.user?.username }}</h2>
                <p>{{ userStore.user?.email }}</p>
                <div class="user-stats">
                  <div class="stat-item">
                    <span class="stat-number">{{ travelStore.plans.length }}</span>
                    <span class="stat-label">旅行计划</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ totalDays }}</span>
                    <span class="stat-label">旅行天数</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ totalBudget }}</span>
                    <span class="stat-label">总预算</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </section>

        <!-- 功能菜单 -->
        <section class="function-menu">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="menu-card" @click="$router.push('/planner')">
                <div class="menu-item">
                  <el-icon size="32"><MapLocation /></el-icon>
                  <h3>行程规划</h3>
                  <p>创建和管理您的旅行计划</p>
                </div>
              </el-card>
            </el-col>
            <!-- 预算管理暂时隐藏 -->
            <el-col :span="8">
              <el-card class="menu-card" @click="showSettings = true">
                <div class="menu-item">
                  <el-icon size="32"><Setting /></el-icon>
                  <h3>设置</h3>
                  <p>个性化设置和偏好</p>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </section>

        <!-- 最近计划 -->
        <section class="recent-plans">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最近的旅行计划</span>
                <el-button type="text" @click="$router.push('/planner')">查看全部</el-button>
              </div>
            </template>
            
            <div class="plan-list">
              <div 
                v-for="plan in recentPlans" 
                :key="plan.id"
                class="plan-item"
                @click="selectPlan(plan)"
              >
                <div class="plan-info">
                  <h4>{{ plan.title }}</h4>
                  <p>{{ plan.basic_info?.destination }}</p>
                  <span class="date">{{ formatDate(plan.basic_info?.startDate) }} - {{ formatDate(plan.basic_info?.endDate) }}</span>
                </div>
                <div class="plan-meta">
                  <el-tag>{{ plan.basic_info?.travelers }}人</el-tag>
                  <el-tag>{{ getPlanDays(plan) }}天</el-tag>
                  <el-tag type="success">¥{{ plan.basic_info?.budget }}</el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </section>

        <!-- 数据统计 -->
        <section class="data-stats">
          <el-card>
            <template #header>
              <span>数据统计</span>
            </template>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24"><Calendar /></el-icon>
                </div>
                <div class="stat-content">
                  <h4>本月计划</h4>
                  <p class="stat-number">{{ monthlyPlans }}</p>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24"><Location /></el-icon>
                </div>
                <div class="stat-content">
                  <h4>访问城市</h4>
                  <p class="stat-number">{{ visitedCities }}</p>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24"><Money /></el-icon>
                </div>
                <div class="stat-content">
                  <h4>总支出</h4>
                  <p class="stat-number">¥{{ totalExpenses }}</p>
                </div>
              </div>
              <!-- 平均评分已移除 -->
            </div>
          </el-card>
        </section>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="设置" width="600px">
      <el-tabs v-model="activeSettingsTab">
        <el-tab-pane label="个人信息" name="profile">
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateProfile">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="旅行偏好" name="preferences">
          <el-form label-width="120px">
            <el-form-item label="旅行偏好">
              <el-select
                v-model="travelPreferences"
                multiple
                filterable
                allow-create
                placeholder="选择或输入偏好"
                style="width: 100%"
              >
                <el-option label="美食" value="美食" />
                <el-option label="文化" value="文化" />
                <el-option label="自然" value="自然" />
                <el-option label="购物" value="购物" />
                <el-option label="娱乐" value="娱乐" />
                <el-option label="历史" value="历史" />
                <el-option label="艺术" value="艺术" />
                <el-option label="运动" value="运动" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updatePreferences">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 隐私设置已移除 -->
      </el-tabs>
    </el-dialog>

    <!-- 头像更换功能已移除（button 与上传对话框） -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTravelStore } from '@/stores/travel'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const travelStore = useTravelStore()

const showSettings = ref(false)
const activeSettingsTab = ref('profile')

const profileForm = ref({
  username: userStore.user?.username || '',
  email: userStore.user?.email || '',
  phone: ''
})

// 旅行偏好：从 user store 初始化
const travelPreferences = ref<string[]>(Array.isArray(userStore.preferences) ? [...(userStore.preferences as any)] : [])

// 计算属性
const recentPlans = computed(() => {
  return travelStore.plans.slice(0, 3)
})

const totalDays = computed(() => {
  return travelStore.plans.reduce((total, plan) => {
    // prefer explicit days field, fallback to computing from dates
    const days = plan?.basic_info?.days
    if (typeof days === 'number' && days > 0) return total + days
    const start = dayjs(plan?.basic_info?.startDate)
    const end = dayjs(plan?.basic_info?.endDate)
    if (!start.isValid() || !end.isValid()) return total
    return total + end.diff(start, 'day') + 1
  }, 0)
})

const totalBudget = computed(() => {
  return travelStore.plans.reduce((total, plan) => {
    const b = plan?.basic_info?.budget
    return total + (typeof b === 'number' ? b : Number(b) || 0)
  }, 0)
})

const monthlyPlans = computed(() => {
  const currentMonth = dayjs().month()
  return travelStore.plans.filter(plan => {
    const sd = plan?.basic_info?.startDate
    return sd ? dayjs(sd).month() === currentMonth : false
  }).length
})

const visitedCities = computed(() => {
  const cities = new Set(travelStore.plans.map(plan => plan.basic_info?.destination))
  cities.delete(undefined)
  return cities.size
})

const totalExpenses = computed(() => {
  // 将所有计划的 basic_info.budget 累加为总支出
  return travelStore.plans.reduce((sum, plan) => {
    const b = plan?.basic_info?.budget
    return sum + (typeof b === 'number' ? b : Number(b) || 0)
  }, 0)
})

// 选择计划
const selectPlan = (plan: any) => {
  travelStore.setCurrentPlan(plan)
  router.push('/planner')
}

// 更新个人信息
const updateProfile = async () => {
  try {
    // 这里调用API更新用户信息
    ElMessage.success('个人信息更新成功')
    showSettings.value = false
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

// 更新偏好设置
const updatePreferences = async () => {
  try {
    // 保存旅行偏好到 user store（本地存储）
    userStore.setPreferences(travelPreferences.value)
    ElMessage.success('旅行偏好保存成功')
    showSettings.value = false
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

// 头像上传功能已移除

// 返回某条计划的天数（优先使用 basic_info.days，回退到日期计算）
const getPlanDays = (plan: any) => {
  const days = plan?.basic_info?.days
  if (typeof days === 'number' && days > 0) return days
  const sd = plan?.basic_info?.startDate
  const ed = plan?.basic_info?.endDate
  const s = dayjs(sd)
  const e = dayjs(ed)
  if (!s.isValid() || !e.isValid()) return 0
  return e.diff(s, 'day') + 1
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
  // 加载用户的旅行计划
  await travelStore.fetchPlans()
})
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
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

    .el-button.is-active {
      text-decoration: underline;
      text-decoration-color: #409eff;
      text-underline-offset: 4px;
      color: #409eff;
    }
  }
}

.main-content {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.user-info {
  margin-bottom: 2rem;

  .user-card {
    display: flex;
    align-items: center;
    gap: 2rem;

    .avatar-section {
      text-align: center;

      .el-button {
        margin-top: 0.5rem;
      }
    }

    .user-details {
      flex: 1;

      h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
      }

      p {
        margin: 0 0 1rem 0;
        color: #666;
      }

      .user-stats {
        display: flex;
        gap: 2rem;

        .stat-item {
          text-align: center;

          .stat-number {
            display: block;
            font-size: 1.5rem;
            font-weight: bold;
            color: #409eff;
          }

          .stat-label {
            font-size: 0.9rem;
            color: #666;
          }
        }
      }
    }
  }
}

.function-menu {
  margin-bottom: 2rem;

  .menu-card {
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .menu-item {
      text-align: center;
      padding: 1rem;

      h3 {
        margin: 1rem 0 0.5rem 0;
        font-size: 1.2rem;
      }

      p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
    }
  }
}

.recent-plans {
  margin-bottom: 2rem;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .plan-list {
    .plan-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #f5f5f5;
        border-color: #409eff;
      }

      .plan-info {
        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }

        p {
          margin: 0 0 0.5rem 0;
          color: #666;
        }

        .date {
          font-size: 0.9rem;
          color: #999;
        }
      }

      .plan-meta {
        display: flex;
        gap: 0.5rem;
      }
    }
  }
}

.data-stats {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      background: white;

      .stat-icon {
        color: #409eff;
      }

      .stat-content {
        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: #666;
        }

        .stat-number {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
        }
      }
    }
  }
}

.avatar-upload {
  text-align: center;

  .avatar-uploader {
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 100px;
      height: 100px;
      line-height: 100px;
      text-align: center;
      border: 1px dashed #d9d9d9;
      border-radius: 50%;
    }
  }

  .upload-hint {
    margin-top: 1rem;
    color: #666;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .user-card {
    flex-direction: column;
    text-align: center;
  }

  .function-menu {
    .el-col {
      margin-bottom: 1rem;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
