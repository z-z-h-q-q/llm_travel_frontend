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
          <el-button @click="$router.push('/')" type="text">首页</el-button>
          <el-button @click="$router.push('/planner')" type="text">行程规划</el-button>
          <el-button @click="$router.push('/budget')" type="text">预算管理</el-button>
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
                <el-button type="text" @click="showAvatarDialog = true">更换头像</el-button>
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
            <el-col :span="8">
              <el-card class="menu-card" @click="$router.push('/budget')">
                <div class="menu-item">
                  <el-icon size="32"><Money /></el-icon>
                  <h3>预算管理</h3>
                  <p>跟踪和管理旅行支出</p>
                </div>
              </el-card>
            </el-col>
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
                  <p>{{ plan.destination }}</p>
                  <span class="date">{{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}</span>
                </div>
                <div class="plan-meta">
                  <el-tag>{{ plan.travelers }}人</el-tag>
                  <el-tag type="success">¥{{ plan.budget }}</el-tag>
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
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24"><Star /></el-icon>
                </div>
                <div class="stat-content">
                  <h4>平均评分</h4>
                  <p class="stat-number">{{ averageRating }}</p>
                </div>
              </div>
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
        
        <el-tab-pane label="偏好设置" name="preferences">
          <el-form :model="preferencesForm" label-width="100px">
            <el-form-item label="语言">
              <el-select v-model="preferencesForm.language">
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="时区">
              <el-select v-model="preferencesForm.timezone">
                <el-option label="北京时间" value="Asia/Shanghai" />
                <el-option label="东京时间" value="Asia/Tokyo" />
                <el-option label="纽约时间" value="America/New_York" />
              </el-select>
            </el-form-item>
            <el-form-item label="货币">
              <el-select v-model="preferencesForm.currency">
                <el-option label="人民币 (¥)" value="CNY" />
                <el-option label="美元 ($)" value="USD" />
                <el-option label="日元 (¥)" value="JPY" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updatePreferences">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="隐私设置" name="privacy">
          <el-form label-width="120px">
            <el-form-item label="数据同步">
              <el-switch v-model="privacySettings.dataSync" />
            </el-form-item>
            <el-form-item label="位置共享">
              <el-switch v-model="privacySettings.locationShare" />
            </el-form-item>
            <el-form-item label="个性化推荐">
              <el-switch v-model="privacySettings.personalizedRecommendation" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updatePrivacySettings">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 头像上传对话框 -->
    <el-dialog v-model="showAvatarDialog" title="更换头像" width="400px">
      <div class="avatar-upload">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
        >
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <p class="upload-hint">点击上传头像，支持 JPG、PNG 格式</p>
      </div>
      
      <template #footer>
        <el-button @click="showAvatarDialog = false">取消</el-button>
        <el-button type="primary" @click="updateAvatar">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTravelStore } from '@/stores/travel'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const travelStore = useTravelStore()

const showSettings = ref(false)
const showAvatarDialog = ref(false)
const activeSettingsTab = ref('profile')
const avatarUrl = ref('')

const profileForm = ref({
  username: userStore.user?.username || '',
  email: userStore.user?.email || '',
  phone: ''
})

const preferencesForm = ref({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  currency: 'CNY'
})

const privacySettings = ref({
  dataSync: true,
  locationShare: false,
  personalizedRecommendation: true
})

// 计算属性
const recentPlans = computed(() => {
  return travelStore.plans.slice(0, 3)
})

const totalDays = computed(() => {
  return travelStore.plans.reduce((total, plan) => {
    const start = dayjs(plan.startDate)
    const end = dayjs(plan.endDate)
    return total + end.diff(start, 'day') + 1
  }, 0)
})

const totalBudget = computed(() => {
  return travelStore.plans.reduce((total, plan) => total + plan.budget, 0)
})

const monthlyPlans = computed(() => {
  const currentMonth = dayjs().month()
  return travelStore.plans.filter(plan => 
    dayjs(plan.startDate).month() === currentMonth
  ).length
})

const visitedCities = computed(() => {
  const cities = new Set(travelStore.plans.map(plan => plan.destination))
  return cities.size
})

const totalExpenses = computed(() => {
  // 模拟数据
  return 15000
})

const averageRating = computed(() => {
  // 模拟数据
  return 4.5
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
    // 这里调用API更新偏好设置
    ElMessage.success('偏好设置更新成功')
    showSettings.value = false
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

// 更新隐私设置
const updatePrivacySettings = async () => {
  try {
    // 这里调用API更新隐私设置
    ElMessage.success('隐私设置更新成功')
    showSettings.value = false
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

// 头像上传前处理
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }

  // 预览图片
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  
  return false // 阻止自动上传
}

// 更新头像
const updateAvatar = async () => {
  try {
    // 这里调用API更新头像
    ElMessage.success('头像更新成功')
    showAvatarDialog.value = false
  } catch (error) {
    ElMessage.error('头像更新失败，请重试')
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
