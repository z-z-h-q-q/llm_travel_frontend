# AI旅行规划师 (AI Travel Planner)

一个基于Vue3的智能旅行规划应用，通过AI技术简化旅行规划过程，提供个性化的旅行路线和建议。

## 功能特色

### 🎯 核心功能
- **智能行程规划**: 通过语音或文字输入旅行需求，AI自动生成个性化旅行路线
- **费用预算与管理**: AI预算分析，语音记录旅行开销
- **用户管理与数据存储**: 注册登录系统，云端行程同步
- **语音交互**: 基于科大讯飞语音识别API的语音输入功能
- **地图导航**: 基于高德地图API的地理位置服务和导航功能

### 🛠 技术栈
- **前端框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **UI组件库**: Element Plus
- **地图服务**: 高德地图 API
- **语音识别**: 科大讯飞语音识别 API
- **图表库**: ECharts
- **构建工具**: Vite

## 项目结构

```
src/
├── components/          # 公共组件
├── views/              # 页面组件
│   ├── Home.vue        # 首页
│   ├── Login.vue       # 登录页
│   ├── Register.vue    # 注册页
│   ├── Planner.vue    # 行程规划页
│   ├── Budget.vue     # 预算管理页
│   └── Profile.vue    # 个人中心页
├── stores/             # Pinia状态管理
│   ├── user.ts         # 用户状态
│   └── travel.ts       # 旅行状态
├── utils/              # 工具函数
│   ├── api.ts          # API请求
│   ├── speech.ts       # 语音识别
│   └── map.ts          # 地图服务
├── router/             # 路由配置
└── main.ts            # 应用入口
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 环境配置
1. 复制 `env.example` 为 `.env`
2. 配置必要的API密钥：
   - 高德地图API密钥
   - 科大讯飞语音识别API密钥
   - AI模型API密钥

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 主要页面

### 🏠 首页 (Home.vue)
- 语音输入旅行需求
- 功能特色展示
- 快速开始按钮

### 🗺️ 行程规划 (Planner.vue)
- 地图展示旅行路线
- 详细的行程安排
- 住宿和交通信息
- 语音更新行程

### 💰 预算管理 (Budget.vue)
- 预算概览和统计
- 支出记录和管理
- 语音记录支出
- 数据可视化图表

### 👤 个人中心 (Profile.vue)
- 用户信息管理
- 旅行数据统计
- 个性化设置

## API集成

### 语音识别
- 集成科大讯飞语音识别API
- 支持中文语音识别
- 实时语音转文字

### 地图服务
- 集成高德地图API
- 支持地图展示和路线规划
- 地理位置服务

### AI服务
- 集成大语言模型API
- 智能行程规划
- 个性化推荐

## 开发指南

### 添加新功能
1. 在 `src/views/` 中创建新页面
2. 在 `src/router/index.ts` 中添加路由
3. 在 `src/stores/` 中添加状态管理
4. 在 `src/utils/` 中添加工具函数

### 样式规范
- 使用SCSS预处理器
- 遵循BEM命名规范
- 响应式设计，支持移动端

### 代码规范
- 使用TypeScript
- 遵循Vue 3 Composition API
- 使用ESLint和Prettier

## 部署说明

### 生产环境配置
1. 配置生产环境API地址
2. 设置CDN资源路径
3. 配置HTTPS证书

### 性能优化
- 代码分割和懒加载
- 图片压缩和优化
- 缓存策略配置

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱: your-email@example.com
- GitHub: https://github.com/your-username/ai-travel-planner
