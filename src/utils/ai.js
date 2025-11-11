// AI解析服务
import { api } from '../services/index.js';

export class AIParseService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1';
  }

  // 解析语音文本为结构化数据
  async parseVoiceText(text) {
    try {
      // 这里可以调用真实的AI API
      // const response = await this.callAIAPI(text);
      
      // 模拟AI解析结果
      return this.simulateParseResult(text);
    } catch (error) {
      console.error('AI解析失败:', error);
      throw new Error('AI解析失败');
    }
  }

  // 模拟AI解析结果
  simulateParseResult(text) {
    // 简单的关键词匹配逻辑
    const result = {
      destination: '',
      startDate: '',
      endDate: '',
      budget: 0,
      travelers: 1,
      preferences: []
    };

    // 提取目的地
    const destinationKeywords = ['去', '到', '前往', '旅游', '旅行'];
    const destinationMatch = text.match(/(?:去|到|前往|旅游|旅行)([^，。！？\s]+)/);
    if (destinationMatch) {
      result.destination = destinationMatch[1].trim();
    }

    // 提取日期
    const dateKeywords = ['月', '日', '号', '年'];
    const dateMatch = text.match(/(\d{1,2}[月日号]|\d{4}年)/g);
    if (dateMatch) {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      result.startDate = nextMonth.toISOString().split('T')[0];
      result.endDate = new Date(nextMonth.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // 提取预算
    const budgetMatch = text.match(/(\d+)[元万]/);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1]);
      result.budget = budgetMatch[0].includes('万') ? amount * 10000 : amount;
    }

    // 提取人数
    const travelerMatch = text.match(/(\d+)人/);
    if (travelerMatch) {
      result.travelers = parseInt(travelerMatch[1]);
    }

    // 提取偏好
    const preferenceKeywords = {
      '美食': ['美食', '吃', '餐厅', '小吃'],
      '文化': ['文化', '历史', '博物馆', '古迹'],
      '自然': ['自然', '风景', '山水', '公园'],
      '购物': ['购物', '买', '商场', '商店'],
      '娱乐': ['娱乐', '玩', '游戏', '活动']
    };

    for (const [preference, keywords] of Object.entries(preferenceKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        result.preferences.push(preference);
      }
    }

    // 如果没有识别到任何信息，提供默认值
    if (!result.destination) {
      result.destination = '北京';
    }
    if (!result.startDate) {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      result.startDate = nextWeek.toISOString().split('T')[0];
      result.endDate = new Date(nextWeek.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    if (result.budget === 0) {
      result.budget = 5000;
    }
    if (result.preferences.length === 0) {
      result.preferences = ['美食', '文化'];
    }

    return result;
  }

  // 调用真实的AI API
  async callAIAPI(text) {
    try {
      const response = await api.post('/ai/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一个旅行规划助手。请从用户的语音输入中提取以下信息：
            1. 目的地
            2. 出发日期
            3. 返回日期
            4. 预算（数字）
            5. 同行人数
            6. 旅行偏好（美食、文化、自然、购物、娱乐）
            
            请以JSON格式返回结果，如果某个信息无法识别，请返回null。`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('AI API调用失败:', error);
      throw new Error('AI API调用失败');
    }
  }
}

// 创建全局实例
export const aiParseService = new AIParseService();