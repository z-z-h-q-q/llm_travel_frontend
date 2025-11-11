import { api } from './api.js'

/**
 * 语音识别API服务
 * 专门处理与后端语音识别服务的交互
 * 完全依赖后端进行语音识别处理
 */
export class SpeechRecognitionApiService {
  /**
   * 发送音频数据到后端进行语音识别
   * @param {Blob} audioBlob - 音频数据Blob
   * @param {Object} options - 识别选项
   * @param {string} options.format - 音频格式，默认为'wav'
   * @param {string} options.language - 语言代码，默认为'zh-CN'
   * @param {number} options.timeout - 请求超时时间（毫秒），默认为30000
   * @returns {Promise<string>} - 识别出的文本（后端语音识别的返回值）
   */
  async recognizeSpeech(audioBlob, options = {}) {
    try {
      // 设置请求超时
      const controller = new AbortController()
      const timeout = options.timeout || 30000
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      // 准备FormData数据
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      formData.append('format', options.format || 'wav')
      formData.append('language', options.language || 'zh-CN')
      
      // 发送到后端语音识别服务
      console.log('正在发送音频数据到后端语音识别服务...')
      const response = await api.post('/speech/recognize', formData, {
        headers: {
          // 不需要设置Content-Type，FormData会自动设置
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // 确保响应数据有效
      const data = response.data
      if (!data || !data.text) {
        throw new Error('后端语音识别服务未返回有效文本')
      }
      
      console.log('后端语音识别成功完成')
      return data.text // 直接返回后端识别的文本作为结果
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('语音识别请求超时')
        throw new Error('语音识别请求超时')
      }
      console.error('语音识别失败:', error)
      // 转换错误信息为用户友好的格式
      throw new Error(`语音识别失败: ${error.response?.data?.message || error.message || '未知错误'}`)
    }
  }

  /**
   * 批量处理多个音频文件
   * @param {Array<{blob: Blob, options?: Object}>} audioItems - 音频项目数组
   * @returns {Promise<Array<{text: string, index: number}>>} - 识别结果数组
   */
  async batchRecognizeSpeech(audioItems) {
    try {
      const results = []
      
      // 串行处理每个音频文件
      for (let i = 0; i < audioItems.length; i++) {
        const item = audioItems[i]
        try {
          const text = await this.recognizeSpeech(item.blob, item.options)
          results.push({ text, index: i })
        } catch (error) {
          console.error(`处理第${i + 1}个音频失败:`, error)
          results.push({ text: null, error: error.message, index: i })
        }
      }
      
      return results
    } catch (error) {
      console.error('批量语音识别失败:', error)
      throw error
    }
  }

  /**
   * 检查语音识别服务状态
   * @returns {Promise<{status: string, version: string}>} - 服务状态信息
   */
  async checkServiceStatus() {
    try {
      const response = await api.get('/speech/status')
      return response.data
    } catch (error) {
      console.error('检查语音识别服务状态失败:', error)
      throw new Error('无法连接到语音识别服务')
    }
  }

  /**
   * 获取支持的语言列表
   * @returns {Promise<Array<{code: string, name: string}>>} - 支持的语言列表
   */
  async getSupportedLanguages() {
    try {
      const response = await api.get('/speech/languages')
      return response.data.languages || []
    } catch (error) {
      console.error('获取支持的语言列表失败:', error)
      // 返回默认支持的语言
      return [{ code: 'zh-CN', name: '中文' }, { code: 'en-US', name: '英文' }]
    }
  }
}

// 创建单例实例
export const speechApiService = new SpeechRecognitionApiService()

export default speechApiService