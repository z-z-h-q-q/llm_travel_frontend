<template>
  <div class="home">
    <!-- 头部导航 -->
    <header class="header">
      <div class="container">
        <div class="logo">
          <el-icon><Location /></el-icon>
          <span>AI旅行规划师</span>
        </div>
        <nav class="nav">
          <el-button v-if="!userStore.isAuthenticated" @click="$router.push('/login')" type="primary">
            登录
          </el-button>
          <el-button v-if="!userStore.isAuthenticated" @click="$router.push('/register')">
            注册
          </el-button>
          <el-dropdown v-else>
            <el-button type="primary">
              {{ userStore.user?.username }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </nav>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="main">
      <div class="container">
        <!-- 欢迎区域 -->
        <section class="hero">
          <h1 class="hero-title">智能旅行规划，让每一次出行都完美</h1>
          <p class="hero-subtitle">AI驱动的个性化旅行规划，语音交互，智能推荐，让旅行更简单</p>
          
          <!-- 旅行需求输入区域 -->
          <div class="travel-input-section">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>填写旅行需求</span>
                  <div class="voice-controls">
                    <el-button 
                      :type="isListening ? 'danger' : 'primary'" 
                      :icon="isListening ? 'Microphone' : 'Microphone'" 
                      @click="toggleVoiceInput"
                      :loading="isProcessing"
                    >
                      {{ isListening ? '停止录音' : '语音输入' }}
                    </el-button>
                    <p class="voice-hint">{{ isListening ? '正在听取您的需求...' : '点击语音输入' }}</p>
                  </div>
                </div>
              </template>
              
              <!-- 语音识别结果 -->
              <div v-if="voiceText" class="voice-result">
                <el-alert 
                  :title="`语音识别结果：${voiceText}`" 
                  type="info" 
                  :closable="false"
                  show-icon
                />
                <el-button @click="processVoiceInput" type="primary" :loading="isProcessing" style="margin-top: 1rem;">
                  解析语音内容
                </el-button>
              </div>

              <el-form :model="travelForm" label-width="100px" size="large">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="目的地">
                      <el-input v-model="travelForm.destination" placeholder="请输入目的地" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="同行人数">
                      <el-input-number v-model="travelForm.travelers" :min="1" :max="20" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="出发日期">
                      <el-date-picker v-model="travelForm.startDate" type="date" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="返回日期">
                      <el-date-picker v-model="travelForm.endDate" type="date" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="预算">
                      <el-input-number v-model="travelForm.budget" :min="0" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="旅行偏好">
                      <el-select 
                        v-model="travelForm.preferences" 
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
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </div>

          <!-- 快速开始按钮 -->
          <div class="quick-start">
            <el-button @click="startPlanning" type="primary" size="large" :loading="isProcessing">
              开始规划旅行
            </el-button>
          </div>
        </section>

        <!-- 功能特色 -->
        <section class="features">
          <div class="feature-grid">
            <div class="feature-card">
              <el-icon size="48"><Microphone /></el-icon>
              <h3>语音交互</h3>
              <p>通过语音输入旅行需求，AI智能理解并生成个性化行程</p>
            </div>
            <div class="feature-card">
              <el-icon size="48"><MapLocation /></el-icon>
              <h3>智能地图</h3>
              <p>基于高德地图的精准定位和路线规划，让出行更便捷</p>
            </div>
            <div class="feature-card">
              <el-icon size="48"><Money /></el-icon>
              <h3>预算管理</h3>
              <p>智能预算分析和费用管理，让每一分钱都花在刀刃上</p>
            </div>
            <div class="feature-card">
              <el-icon size="48"><CloudUpload /></el-icon>
              <h3>云端同步</h3>
              <p>多设备数据同步，随时随地查看和修改旅行计划</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTravelStore } from '@/stores/travel'
import { speechRecognition, speechSynthesis } from '@/utils/speech'
import { aiParseService } from '@/utils/ai'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const travelStore = useTravelStore()

const isListening = ref(false)
const isProcessing = ref(false)
const voiceText = ref('')

const travelForm = ref({
  destination: '',
  startDate: '',
  endDate: '',
  travelers: 1,
  budget: 0,
  preferences: []
})

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
    // 使用AI解析服务
    const parsedData = await aiParseService.parseVoiceText(voiceText.value)
    
    // 将解析结果填充到表单中
    travelForm.value.destination = parsedData.destination
    travelForm.value.startDate = parsedData.startDate
    travelForm.value.endDate = parsedData.endDate
    travelForm.value.budget = parsedData.budget
    travelForm.value.travelers = parsedData.travelers
    travelForm.value.preferences = parsedData.preferences
    
    ElMessage.success('语音解析完成，已填充到表单中，您可以直接修改')
  } catch (error) {
    ElMessage.error('语音解析失败，请重试')
  } finally {
    isProcessing.value = false
  }
}


// 开始规划
const startPlanning = async () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 检查表单是否填写完整
  if (!travelForm.value.destination || !travelForm.value.startDate || !travelForm.value.endDate) {
    ElMessage.warning('请先填写旅行需求信息')
    return
  }

  isProcessing.value = true
  try {
    const planData = {
      title: `${travelForm.value.destination}旅行计划`,
      destination: travelForm.value.destination,
      startDate: travelForm.value.startDate,
      endDate: travelForm.value.endDate,
      budget: travelForm.value.budget,
      travelers: travelForm.value.travelers,
      preferences: travelForm.value.preferences
    }

    const plan = await travelStore.createPlan(planData)
    travelStore.setCurrentPlan(plan)
    ElMessage.success('旅行计划创建成功')
    router.push('/planner')
  } catch (error) {
    ElMessage.error('创建计划失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
}

onMounted(() => {
  // 初始化语音服务
  speechSynthesis.speak('欢迎使用AI旅行规划师，请说出您的旅行需求')
})
</script>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;

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
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
  }

  .nav {
    display: flex;
    gap: 1rem;
  }
}

.main {
  padding: 4rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero {
  text-align: center;
  color: white;
  margin-bottom: 4rem;

  .hero-title {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .hero-subtitle {
    font-size: 1.2rem;
    margin-bottom: 3rem;
    opacity: 0.9;
  }
}

.travel-input-section {
  margin: 3rem 0;

  .el-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    max-width: 800px;
    margin: 0 auto;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;

    .voice-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .voice-hint {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
    }
  }

  .voice-result {
    margin-bottom: 1.5rem;
  }
}

.quick-start {
  margin-top: 2rem;
}

.features {
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 4rem;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    color: white;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }

    h3 {
      font-size: 1.5rem;
      margin: 1rem 0;
    }

    p {
      opacity: 0.9;
      line-height: 1.6;
    }
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .container {
    padding: 0 1rem;
  }
}
</style>
