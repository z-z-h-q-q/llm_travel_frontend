import { speechApiService } from './speech-api.js'

/**
 * 语音识别服务
 * 提供语音识别功能，完全依赖后端语音识别服务
 */
export class SpeechRecognitionService {
  constructor() {
    // 配置项
    this.config = {
      lang: 'zh-CN',
      maxDuration: 30000, // 最大录音时长30秒
      sampleRate: 16000,  // 采样率
      timeout: 30000,     // API请求超时时间
    }

    // 状态
    this.isRecording = false
    this.mediaRecorder = null
    this.audioChunks = []
    this.recordingStartTime = null
    this.timeoutId = null
    
    // 回调函数
    this.onResultCallback = null
    this.onErrorCallback = null
    this.onRecordingStartCallback = null
    this.onRecordingEndCallback = null
  }

  /**
   * 配置服务
   * @param {Object} config - 配置对象
   */
  configure(config) {
    this.config = { ...this.config, ...config }
  }

  /**
   * 设置回调函数
   * @param {Object} callbacks - 回调函数对象
   */
  setCallbacks(callbacks) {
    if (callbacks.onResult) this.onResultCallback = callbacks.onResult
    if (callbacks.onError) this.onErrorCallback = callbacks.onError
    if (callbacks.onRecordingStart) this.onRecordingStartCallback = callbacks.onRecordingStart
    if (callbacks.onRecordingEnd) this.onRecordingEndCallback = callbacks.onRecordingEnd
  }

  /**
   * 开始录音
   * @returns {Promise<void>}
   */
  async startRecording() {
    if (this.isRecording) {
      console.warn('已经在录音中')
      return
    }

    try {
      // 获取媒体流
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      // 创建MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []
      this.isRecording = true
      this.recordingStartTime = Date.now()

      // 收集音频数据
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      // 录音结束时处理
      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
          
          // 使用后端API进行语音识别
          console.log('发送音频数据到后端进行语音识别...')
          const text = await speechApiService.recognizeSpeech(audioBlob, {
            language: this.config.lang,
            format: 'wav',
            timeout: this.config.timeout
          })
          
          if (this.onResultCallback) {
            this.onResultCallback(text) // 直接返回后端识别的文本
          }
        } catch (error) {
          console.error('处理录音数据时出错:', error)
          if (this.onErrorCallback) {
            this.onErrorCallback(error)
          }
        } finally {
          // 清理
          this._cleanupRecording()
        }
      }

      // 开始录音
      this.mediaRecorder.start()
      
      // 设置最大录音时长
      this.timeoutId = setTimeout(() => {
        if (this.isRecording) {
          console.log('录音超时，自动停止')
          this.stopRecording()
        }
      }, this.config.maxDuration)

      // 通知开始回调
      if (this.onRecordingStartCallback) {
        this.onRecordingStartCallback()
      }
    } catch (error) {
      console.error('开始录音失败:', error)
      if (this.onErrorCallback) {
        this.onErrorCallback(error)
      }
      this.isRecording = false
    }
  }

  /**
   * 停止录音
   */
  stopRecording() {
    if (!this.isRecording) {
      return
    }

    // 清除超时计时器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // 停止MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    // 通知结束回调
    if (this.onRecordingEndCallback) {
      this.onRecordingEndCallback()
    }
  }

  /**
   * 清理录音相关资源
   * @private
   */
  _cleanupRecording() {
    // 停止所有轨道
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }

    // 重置状态
    this.isRecording = false
    this.mediaRecorder = null
    this.recordingStartTime = null
    // 注意：不重置回调函数，让用户可以继续使用
  }

  /**
   * 从音频文件进行识别
   * @param {File} audioFile - 音频文件对象
   * @returns {Promise<string>} - 识别出的文本
   */
  async recognizeFromFile(audioFile) {
    try {
      const text = await speechApiService.recognizeSpeech(audioFile, {
        language: this.config.lang,
        timeout: this.config.timeout
      })
      return text
    } catch (error) {
      console.error('从文件识别语音失败:', error)
      if (this.onErrorCallback) {
        this.onErrorCallback(error)
      }
      throw error
    }
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.stopRecording()
    this.onResultCallback = null
    this.onErrorCallback = null
    this.onRecordingStartCallback = null
    this.onRecordingEndCallback = null
  }
}

/**
 * 语音合成服务
 */
export class SpeechSynthesisService {
  constructor() {
    this.synthesis = window.speechSynthesis
  }

  /**
   * 语音播报
   * @param {string} text - 要播报的文本
   * @param {string} lang - 语言代码，默认为'zh-CN'
   */
  speak(text, lang = 'zh-CN') {
    if (!this.synthesis) {
      console.error('浏览器不支持语音合成')
      return
    }

    // 停止当前播放
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.8
    utterance.pitch = 1
    utterance.volume = 1

    this.synthesis.speak(utterance)
  }

  /**
   * 停止播报
   */
  stop() {
    this.synthesis.cancel()
  }
}

// 创建全局实例
export const speechRecognition = new SpeechRecognitionService()
export const speechSynthesis = new SpeechSynthesisService()