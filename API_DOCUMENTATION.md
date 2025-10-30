# AI旅行规划师 API 接口文档

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 1. 用户认证模块

### 1.1 用户注册

**接口地址**: `POST /auth/register`

**请求参数**:
```json
{
  "username": "string",    // 用户名，3-20个字符
  "email": "string",       // 邮箱地址
  "password": "string"      // 密码，最少6位
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": "user_123",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.2 用户登录

**接口地址**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "string",     // 用户名或邮箱
  "password": "string"      // 密码
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "username": "testuser",
      "email": "test@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 1.3 获取用户信息

**接口地址**: `GET /user/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "user_123",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "13800138000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.4 更新用户信息

**接口地址**: `PUT /user/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "username": "string",     // 可选
  "email": "string",       // 可选
  "phone": "string",       // 可选
  "avatar": "string"       // 可选
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "user_123",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 2. 旅行计划模块

### 2.1 获取旅行计划列表

**接口地址**: `GET /travel/plans`

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `status`: 状态筛选（draft/published/completed）

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "plans": [
      {
        "id": "plan_123",
        "title": "北京5日游",
        "destination": "北京",
        "startDate": "2024-12-01",
        "endDate": "2024-12-05",
        "budget": 5000,
        "travelers": 2,
        "preferences": ["美食", "文化"],
        "status": "draft",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 2.2 创建旅行计划

**接口地址**: `POST /travel/plans`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "title": "string",           // 计划标题
  "destination": "string",      // 目的地
  "startDate": "2024-12-01",   // 出发日期
  "endDate": "2024-12-05",     // 返回日期
  "budget": 5000,              // 预算
  "travelers": 2,               // 同行人数
  "preferences": ["美食", "文化"] // 旅行偏好
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "plan_123",
    "title": "北京5日游",
    "destination": "北京",
    "startDate": "2024-12-01",
    "endDate": "2024-12-05",
    "budget": 5000,
    "travelers": 2,
    "preferences": ["美食", "文化"],
    "itinerary": [],
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2.3 获取旅行计划详情

**接口地址**: `GET /travel/plans/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "plan_123",
    "title": "北京5日游",
    "destination": "北京",
    "startDate": "2024-12-01",
    "endDate": "2024-12-05",
    "budget": 5000,
    "travelers": 2,
    "preferences": ["美食", "文化"],
    "itinerary": [
      {
        "day": 1,
        "date": "2024-12-01",
        "activities": [
          {
            "id": "act_123",
            "name": "天安门广场",
            "type": "attraction",
            "location": {
              "name": "天安门广场",
              "coordinates": [116.397428, 39.90923],
              "address": "北京市东城区"
            },
            "duration": 2,
            "cost": 0,
            "description": "参观天安门广场",
            "rating": 4.5,
            "images": ["https://example.com/image1.jpg"]
          }
        ],
        "accommodation": {
          "id": "hotel_123",
          "name": "北京饭店",
          "type": "hotel",
          "location": {
            "name": "北京饭店",
            "coordinates": [116.407428, 39.91923],
            "address": "北京市东城区"
          },
          "cost": 500,
          "rating": 4.2,
          "amenities": ["WiFi", "早餐", "健身房"],
          "images": ["https://example.com/hotel1.jpg"]
        },
        "meals": [
          {
            "id": "meal_123",
            "name": "全聚德烤鸭",
            "type": "dinner",
            "location": {
              "name": "全聚德烤鸭店",
              "coordinates": [116.407428, 39.91923],
              "address": "北京市东城区"
            },
            "cost": 200,
            "cuisine": "中式",
            "rating": 4.8
          }
        ],
        "transportation": [
          {
            "id": "trans_123",
            "type": "taxi",
            "from": {
              "name": "北京首都国际机场",
              "coordinates": [116.584167, 40.080111]
            },
            "to": {
              "name": "北京饭店",
              "coordinates": [116.407428, 39.91923]
            },
            "cost": 80,
            "duration": 45,
            "description": "机场到酒店"
          }
        ],
        "estimatedCost": 780
      }
    ],
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2.4 更新旅行计划

**接口地址**: `PUT /travel/plans/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "title": "string",           // 可选
  "destination": "string",     // 可选
  "startDate": "2024-12-01",   // 可选
  "endDate": "2024-12-05",     // 可选
  "budget": 5000,              // 可选
  "travelers": 2,               // 可选
  "preferences": ["美食", "文化"] // 可选
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "plan_123",
    "title": "北京5日游（更新）",
    "destination": "北京",
    "startDate": "2024-12-01",
    "endDate": "2024-12-05",
    "budget": 6000,
    "travelers": 2,
    "preferences": ["美食", "文化", "历史"],
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2.5 删除旅行计划

**接口地址**: `DELETE /travel/plans/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**返回结果**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 3. AI智能规划模块

### 3.1 语音解析

**接口地址**: `POST /ai/parse-voice`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "text": "我想去北京，5天，预算1万元，喜欢美食和动漫，带孩子"
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "解析成功",
  "data": {
    "destination": "北京",
    "startDate": "2024-12-01",
    "endDate": "2024-12-05",
    "budget": 10000,
    "travelers": 3,
    "preferences": ["美食", "动漫", "亲子"]
  }
}
```

### 3.2 生成智能行程

**接口地址**: `POST /ai/generate-itinerary`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "planId": "plan_123",
  "destination": "北京",
  "startDate": "2024-12-01",
  "endDate": "2024-12-05",
  "budget": 5000,
  "travelers": 2,
  "preferences": ["美食", "文化"]
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "生成成功",
  "data": {
    "itinerary": [
      {
        "day": 1,
        "date": "2024-12-01",
        "activities": [
          {
            "id": "act_123",
            "name": "天安门广场",
            "type": "attraction",
            "location": {
              "name": "天安门广场",
              "coordinates": [116.397428, 39.90923],
              "address": "北京市东城区"
            },
            "duration": 2,
            "cost": 0,
            "description": "参观天安门广场",
            "rating": 4.5,
            "images": ["https://example.com/image1.jpg"]
          }
        ],
        "accommodation": {
          "id": "hotel_123",
          "name": "北京饭店",
          "type": "hotel",
          "location": {
            "name": "北京饭店",
            "coordinates": [116.407428, 39.91923],
            "address": "北京市东城区"
          },
          "cost": 500,
          "rating": 4.2,
          "amenities": ["WiFi", "早餐", "健身房"],
          "images": ["https://example.com/hotel1.jpg"]
        },
        "meals": [
          {
            "id": "meal_123",
            "name": "全聚德烤鸭",
            "type": "dinner",
            "location": {
              "name": "全聚德烤鸭店",
              "coordinates": [116.407428, 39.91923],
              "address": "北京市东城区"
            },
            "cost": 200,
            "cuisine": "中式",
            "rating": 4.8
          }
        ],
        "transportation": [
          {
            "id": "trans_123",
            "type": "taxi",
            "from": {
              "name": "北京首都国际机场",
              "coordinates": [116.584167, 40.080111]
            },
            "to": {
              "name": "北京饭店",
              "coordinates": [116.407428, 39.91923]
            },
            "cost": 80,
            "duration": 45,
            "description": "机场到酒店"
          }
        ],
        "estimatedCost": 780
      }
    ]
  }
}
```

---

## 4. 预算管理模块

### 4.1 获取预算概览

**接口地址**: `GET /budget/overview`

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `planId`: 旅行计划ID（可选）

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalBudget": 10000,
    "totalSpent": 3500,
    "remainingBudget": 6500,
    "budgetUsagePercentage": 35,
    "categories": [
      {
        "category": "交通",
        "amount": 2000,
        "percentage": 57.1
      },
      {
        "category": "住宿",
        "amount": 800,
        "percentage": 22.9
      },
      {
        "category": "餐饮",
        "amount": 500,
        "percentage": 14.3
      },
      {
        "category": "购物",
        "amount": 200,
        "percentage": 5.7
      }
    ]
  }
}
```

### 4.2 获取支出记录

**接口地址**: `GET /budget/expenses`

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `planId`: 旅行计划ID（可选）
- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `category`: 支出类别筛选
- `startDate`: 开始日期
- `endDate`: 结束日期

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "expenses": [
      {
        "id": "expense_123",
        "planId": "plan_123",
        "category": "交通",
        "description": "机票",
        "amount": 2000,
        "date": "2024-01-15",
        "location": "北京首都国际机场",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 4.3 添加支出记录

**接口地址**: `POST /budget/expenses`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "planId": "plan_123",        // 可选
  "category": "交通",
  "description": "机票",
  "amount": 2000,
  "date": "2024-01-15",
  "location": "北京首都国际机场"
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "添加成功",
  "data": {
    "id": "expense_123",
    "planId": "plan_123",
    "category": "交通",
    "description": "机票",
    "amount": 2000,
    "date": "2024-01-15",
    "location": "北京首都国际机场",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4.4 更新支出记录

**接口地址**: `PUT /budget/expenses/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "category": "交通",
  "description": "机票（更新）",
  "amount": 2200,
  "date": "2024-01-15",
  "location": "北京首都国际机场"
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "expense_123",
    "planId": "plan_123",
    "category": "交通",
    "description": "机票（更新）",
    "amount": 2200,
    "date": "2024-01-15",
    "location": "北京首都国际机场",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4.5 删除支出记录

**接口地址**: `DELETE /budget/expenses/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**返回结果**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 5. 地图服务模块

### 5.1 获取地点信息

**接口地址**: `GET /map/places`

**请求参数**:
- `query`: 搜索关键词
- `location`: 中心坐标（可选）
- `radius`: 搜索半径（可选）

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "places": [
      {
        "id": "place_123",
        "name": "天安门广场",
        "type": "attraction",
        "location": {
          "name": "天安门广场",
          "coordinates": [116.397428, 39.90923],
          "address": "北京市东城区"
        },
        "rating": 4.5,
        "description": "中国首都北京的中心广场",
        "images": ["https://example.com/image1.jpg"],
        "openingHours": "全天开放",
        "ticketPrice": 0
      }
    ]
  }
}
```

### 5.2 获取路线规划

**接口地址**: `POST /map/routes`

**请求参数**:
```json
{
  "origin": {
    "name": "北京首都国际机场",
    "coordinates": [116.584167, 40.080111]
  },
  "destination": {
    "name": "天安门广场",
    "coordinates": [116.397428, 39.90923]
  },
  "mode": "driving"  // driving, walking, transit
}
```

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "routes": [
      {
        "distance": 32000,
        "duration": 1800,
        "steps": [
          {
            "instruction": "从机场出发",
            "distance": 5000,
            "duration": 300,
            "coordinates": [116.584167, 40.080111]
          },
          {
            "instruction": "沿机场高速行驶",
            "distance": 20000,
            "duration": 900,
            "coordinates": [116.500000, 39.950000]
          },
          {
            "instruction": "到达天安门广场",
            "distance": 7000,
            "duration": 600,
            "coordinates": [116.397428, 39.90923]
          }
        ]
      }
    ]
  }
}
```

---

## 6. 错误处理

### 6.1 参数验证错误

```json
{
  "code": 400,
  "message": "参数验证失败",
  "data": {
    "errors": [
      {
        "field": "username",
        "message": "用户名不能为空"
      },
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

### 6.2 认证失败

```json
{
  "code": 401,
  "message": "未授权访问",
  "data": null
}
```

### 6.3 资源不存在

```json
{
  "code": 404,
  "message": "资源不存在",
  "data": null
}
```

### 6.4 服务器错误

```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null
}
```

---

## 7. 数据模型

### 7.1 用户模型 (User)

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 7.2 旅行计划模型 (TravelPlan)

```typescript
interface TravelPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  preferences: string[];
  itinerary: DayPlan[];
  status: 'draft' | 'published' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

### 7.3 日程计划模型 (DayPlan)

```typescript
interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  accommodation?: Accommodation;
  meals: Meal[];
  transportation: Transportation[];
  estimatedCost: number;
}
```

### 7.4 活动模型 (Activity)

```typescript
interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'entertainment' | 'shopping' | 'culture';
  location: {
    name: string;
    coordinates: [number, number];
    address: string;
  };
  duration: number;
  cost: number;
  description: string;
  rating?: number;
  images?: string[];
}
```

### 7.5 住宿模型 (Accommodation)

```typescript
interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'bnb' | 'apartment';
  location: {
    name: string;
    coordinates: [number, number];
    address: string;
  };
  cost: number;
  rating?: number;
  amenities: string[];
  images?: string[];
}
```

### 7.6 餐饮模型 (Meal)

```typescript
interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  location: {
    name: string;
    coordinates: [number, number];
    address: string;
  };
  cost: number;
  cuisine: string;
  rating?: number;
}
```

### 7.7 交通模型 (Transportation)

```typescript
interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'taxi' | 'subway' | 'walking';
  from: {
    name: string;
    coordinates: [number, number];
  };
  to: {
    name: string;
    coordinates: [number, number];
  };
  cost: number;
  duration: number;
  description: string;
}
```

### 7.8 支出记录模型 (Expense)

```typescript
interface Expense {
  id: string;
  planId?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 8. 开发建议

### 8.1 数据库设计
- 使用关系型数据库（如PostgreSQL）存储结构化数据
- 使用Redis缓存热点数据
- 使用MongoDB存储非结构化数据（如AI生成的内容）

### 8.2 安全考虑
- 实现JWT Token认证
- 密码加密存储
- API限流和防刷
- 输入参数验证和过滤

### 8.3 性能优化
- 数据库索引优化
- 分页查询
- 缓存策略
- 异步处理

### 8.4 第三方集成
- 高德地图API集成
- 科大讯飞语音识别API
- AI大模型API（如OpenAI、Claude等）
- 支付接口（如微信支付、支付宝）

### 8.5 部署建议
- 使用Docker容器化部署
- 使用Nginx作为反向代理
- 配置HTTPS证书
- 实现日志监控和错误追踪
