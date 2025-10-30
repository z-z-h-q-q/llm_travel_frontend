<template>
  <div class="budget-page">
    <!-- 头部导航 -->
    <header class="header">
      <div class="container">
        <div class="logo">
          <el-icon><Money /></el-icon>
          <span>预算管理</span>
        </div>
        <nav class="nav">
          <el-button @click="$router.push('/')" type="text">首页</el-button>
          <el-button @click="$router.push('/planner')" type="text">行程规划</el-button>
          <el-button @click="$router.push('/profile')" type="text">个人中心</el-button>
          <el-button @click="handleLogout" type="text">退出</el-button>
        </nav>
      </div>
    </header>

    <div class="main-content">
      <div class="container">
        <!-- 预算概览 -->
        <section class="budget-overview">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="budget-card">
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon size="32"><Money /></el-icon>
                  </div>
                  <div class="card-info">
                    <h3>总预算</h3>
                    <p class="amount">¥{{ totalBudget.toLocaleString() }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="budget-card">
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon size="32"><ShoppingCart /></el-icon>
                  </div>
                  <div class="card-info">
                    <h3>已花费</h3>
                    <p class="amount spent">¥{{ totalSpent.toLocaleString() }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="budget-card">
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon size="32"><Wallet /></el-icon>
                  </div>
                  <div class="card-info">
                    <h3>剩余预算</h3>
                    <p class="amount remaining">¥{{ remainingBudget.toLocaleString() }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="budget-card">
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon size="32"><TrendCharts /></el-icon>
                  </div>
                  <div class="card-info">
                    <h3>预算使用率</h3>
                    <p class="amount percentage">{{ budgetUsagePercentage }}%</p>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </section>

        <!-- 预算分析图表 -->
        <section class="budget-charts">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>预算分配</span>
                </template>
                <div ref="budgetPieChart" class="chart-container"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>支出趋势</span>
                </template>
                <div ref="expenseLineChart" class="chart-container"></div>
              </el-card>
            </el-col>
          </el-row>
        </section>

        <!-- 支出记录 -->
        <section class="expense-records">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>支出记录</span>
                <el-button type="primary" @click="showAddExpenseDialog = true" :icon="Plus">
                  添加支出
                </el-button>
              </div>
            </template>

            <!-- 语音输入支出 -->
            <div class="voice-expense">
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
                    {{ isListening ? '停止录音' : '语音记录' }}
                  </el-button>
                  <p class="voice-hint">{{ isListening ? '正在听取您的支出信息...' : '点击开始语音记录支出' }}</p>
                </div>
                
                <div v-if="voiceText" class="voice-result">
                  <p><strong>识别结果：</strong>{{ voiceText }}</p>
                  <el-button @click="processVoiceExpense" type="primary" :loading="isProcessing">
                    添加支出
                  </el-button>
                </div>
              </el-card>
            </div>

            <!-- 支出列表 -->
            <div class="expense-list">
              <el-table :data="expenses" style="width: 100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="category" label="类别" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getCategoryType(row.category)">{{ row.category }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="{ row }">
                    <span class="amount">¥{{ row.amount.toLocaleString() }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button size="small" @click="editExpense(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteExpense(row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </section>
      </div>
    </div>

    <!-- 添加支出对话框 -->
    <el-dialog v-model="showAddExpenseDialog" title="添加支出" width="500px">
      <el-form :model="expenseForm" label-width="80px">
        <el-form-item label="类别">
          <el-select v-model="expenseForm.category" placeholder="选择类别">
            <el-option label="交通" value="交通" />
            <el-option label="住宿" value="住宿" />
            <el-option label="餐饮" value="餐饮" />
            <el-option label="购物" value="购物" />
            <el-option label="娱乐" value="娱乐" />
            <el-option label="景点" value="景点" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="expenseForm.description" placeholder="请输入支出描述" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="expenseForm.amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="expenseForm.date" type="date" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddExpenseDialog = false">取消</el-button>
        <el-button type="primary" @click="addExpense">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { speechRecognition, speechSynthesis } from '@/utils/speech'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const showAddExpenseDialog = ref(false)
const isListening = ref(false)
const isProcessing = ref(false)
const voiceText = ref('')

const budgetPieChart = ref<HTMLElement>()
const expenseLineChart = ref<HTMLElement>()

// 模拟数据
const totalBudget = ref(10000)
const expenses = ref([
  { id: 1, date: '2024-01-15', category: '交通', description: '机票', amount: 2000 },
  { id: 2, date: '2024-01-15', category: '住宿', description: '酒店', amount: 800 },
  { id: 3, date: '2024-01-16', category: '餐饮', description: '午餐', amount: 120 },
  { id: 4, date: '2024-01-16', category: '景点', description: '门票', amount: 200 },
  { id: 5, date: '2024-01-16', category: '购物', description: '纪念品', amount: 300 }
])

const expenseForm = ref({
  category: '',
  description: '',
  amount: 0,
  date: dayjs().format('YYYY-MM-DD')
})

// 计算属性
const totalSpent = computed(() => {
  return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
})

const remainingBudget = computed(() => {
  return totalBudget.value - totalSpent.value
})

const budgetUsagePercentage = computed(() => {
  return Math.round((totalSpent.value / totalBudget.value) * 100)
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

// 处理语音支出
const processVoiceExpense = async () => {
  if (!voiceText.value) {
    ElMessage.warning('请先进行语音输入')
    return
  }

  isProcessing.value = true
  try {
    // 这里可以调用AI API解析语音内容
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟解析结果
    expenseForm.value = {
      category: '餐饮',
      description: voiceText.value,
      amount: 150,
      date: dayjs().format('YYYY-MM-DD')
    }
    
    showAddExpenseDialog.value = true
    ElMessage.success('语音解析成功')
  } catch (error) {
    ElMessage.error('语音解析失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

// 添加支出
const addExpense = () => {
  if (!expenseForm.value.category || !expenseForm.value.description || !expenseForm.value.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }

  const newExpense = {
    id: Date.now(),
    ...expenseForm.value,
    amount: Number(expenseForm.value.amount)
  }

  expenses.value.unshift(newExpense)
  showAddExpenseDialog.value = false
  ElMessage.success('支出添加成功')
  
  // 重置表单
  expenseForm.value = {
    category: '',
    description: '',
    amount: 0,
    date: dayjs().format('YYYY-MM-DD')
  }
}

// 编辑支出
const editExpense = (expense: any) => {
  expenseForm.value = { ...expense }
  showAddExpenseDialog.value = true
}

// 删除支出
const deleteExpense = (id: number) => {
  expenses.value = expenses.value.filter(expense => expense.id !== id)
  ElMessage.success('支出删除成功')
}

// 获取类别类型
const getCategoryType = (category: string) => {
  const typeMap: Record<string, string> = {
    '交通': 'primary',
    '住宿': 'success',
    '餐饮': 'warning',
    '购物': 'danger',
    '娱乐': 'info',
    '景点': 'success',
    '其他': ''
  }
  return typeMap[category] || ''
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

// 初始化图表
const initCharts = () => {
  // 预算分配饼图
  if (budgetPieChart.value) {
    const pieChart = echarts.init(budgetPieChart.value)
    const pieOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '预算分配',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 2000, name: '交通' },
            { value: 2000, name: '住宿' },
            { value: 1500, name: '餐饮' },
            { value: 1000, name: '购物' },
            { value: 1000, name: '娱乐' },
            { value: 500, name: '其他' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    pieChart.setOption(pieOption)
  }

  // 支出趋势线图
  if (expenseLineChart.value) {
    const lineChart = echarts.init(expenseLineChart.value)
    const lineOption = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['1月15日', '1月16日', '1月17日', '1月18日', '1月19日']
      },
      yAxis: {
        type: 'value',
        name: '金额(¥)'
      },
      series: [
        {
          name: '日支出',
          type: 'line',
          data: [2800, 620, 450, 380, 200],
          smooth: true,
          areaStyle: {
            opacity: 0.3
          }
        }
      ]
    }
    lineChart.setOption(lineOption)
  }
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped lang="scss">
.budget-page {
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

.budget-overview {
  margin-bottom: 2rem;

  .budget-card {
    .card-content {
      display: flex;
      align-items: center;
      gap: 1rem;

      .card-icon {
        color: #409eff;
      }

      .card-info {
        h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #666;
        }

        .amount {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;

          &.spent {
            color: #f56c6c;
          }

          &.remaining {
            color: #67c23a;
          }

          &.percentage {
            color: #409eff;
          }
        }
      }
    }
  }
}

.budget-charts {
  margin-bottom: 2rem;

  .chart-container {
    height: 300px;
  }
}

.expense-records {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .voice-expense {
    margin-bottom: 2rem;

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

  .expense-list {
    .amount {
      font-weight: bold;
      color: #f56c6c;
    }
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .budget-overview {
    .el-col {
      margin-bottom: 1rem;
    }
  }

  .budget-charts {
    .el-col {
      margin-bottom: 1rem;
    }
  }
}
</style>
