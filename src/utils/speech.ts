// 走后端解析接口：前端仅录音并上传给后端 /api/ai/parse-voice
// 若后端不可用或失败，回退到浏览器 Web Speech API
export class SpeechRecognitionService {
  private isListening = false
  private onResultCallback?: (text: string) => void
  private onErrorCallback?: (error: string) => void
  private mediaStream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private chunks: BlobPart[] = []
  private webSpeech: any = null

  constructor() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      this.webSpeech = new SR()
      this.webSpeech.continuous = false
      this.webSpeech.interimResults = false
      this.webSpeech.lang = 'zh-CN'
    }
  }

  private cleanup() {
    if (this.mediaRecorder) {
      this.mediaRecorder.ondataavailable = null as any
      this.mediaRecorder.onstop = null as any
      if (this.mediaRecorder.state !== 'inactive') {
        try { this.mediaRecorder.stop() } catch {}
      }
      this.mediaRecorder = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop())
      this.mediaStream = null
    }
    this.chunks = []
  }

  async startListening(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (this.isListening) this.stopListening()
    this.onResultCallback = onResult
    this.onErrorCallback = onError
    this.isListening = true

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType: mime })
      this.chunks = []
      this.mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) this.chunks.push(e.data) }
      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: mime })
          const form = new FormData()
          form.append('audio', blob, `audio.${mime.includes('webm') ? 'webm' : 'ogg'}`)
          const { default: api } = await import('./api')
          const resp = await api.post('/ai/parse-voice', form)
          const data = resp.data?.data
          const text = data?.text || ''
          if (text) this.onResultCallback?.(text)
          else this.onErrorCallback?.('未识别到有效文本')
        } catch (err) {
          // 回退 Web Speech
          if (this.webSpeech) {
            try {
              this.webSpeech.onresult = (event: any) => {
                const result = event.results[0][0].transcript
                this.onResultCallback?.(result)
              }
              this.webSpeech.onerror = (event: any) => {
                this.onErrorCallback?.(event.error)
              }
              this.webSpeech.onend = () => { this.isListening = false }
              this.webSpeech.start()
              return
            } catch {}
          }
          this.onErrorCallback?.('后端解析失败')
        } finally {
          this.cleanup()
          this.isListening = false
        }
      }
      this.mediaRecorder.start(250)
    } catch (e) {
      // 直接回退 Web Speech
      if (this.webSpeech) {
        try {
          this.webSpeech.onresult = (event: any) => {
            const result = event.results[0][0].transcript
            this.onResultCallback?.(result)
          }
          this.webSpeech.onerror = (event: any) => { this.onErrorCallback?.(event.error) }
          this.webSpeech.onend = () => { this.isListening = false }
          this.webSpeech.start()
          return
        } catch {}
      }
      this.isListening = false
      onError?.('无法获取麦克风权限，且无可用识别方式')
    }
  }

  stopListening() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop() } catch {}
    }
    this.cleanup()
    if (this.webSpeech && this.isListening) {
      try { this.webSpeech.stop() } catch {}
    }
    this.isListening = false
  }

  getIsListening() {
    return this.isListening
  }
}

// 语音合成服务
export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis

  constructor() {
    this.synthesis = window.speechSynthesis
  }

  // 语音播报
  speak(text: string, lang = 'zh-CN') {
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

  // 停止播报
  stop() {
    this.synthesis.cancel()
  }
}

// 创建全局实例
export const speechRecognition = new SpeechRecognitionService()
export const speechSynthesis = new SpeechSynthesisService()
// 科大讯飞 WebSocket API + 浏览器 Web Speech 兜底
export class SpeechRecognitionService {
  private isListening = false
  private onResultCallback?: (text: string) => void
  private onErrorCallback?: (error: string) => void
  private ws: WebSocket | null = null
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private useIflytek = !!(import.meta.env.VITE_IFLYTEK_APP_ID && import.meta.env.VITE_IFLYTEK_API_KEY && import.meta.env.VITE_IFLYTEK_API_SECRET)
  private webSpeech: any = null

  constructor() {
    if (!this.useIflytek) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SR) {
        this.webSpeech = new SR()
        this.webSpeech.continuous = false
        this.webSpeech.interimResults = false
        this.webSpeech.lang = 'zh-CN'
      }
    }
  }

  private async sha256HmacBase64(key: string, data: string) {
    const enc = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data))
    return btoa(String.fromCharCode(...new Uint8Array(sig)))
  }

  private async buildIflytekWsUrl(): Promise<string> {
    const host = 'iat-api.xfyun.cn'
    const path = '/v2/iat'
    const date = new Date().toUTCString()
    const appid = import.meta.env.VITE_IFLYTEK_APP_ID as string
    const apiKey = import.meta.env.VITE_IFLYTEK_API_KEY as string
    const apiSecret = import.meta.env.VITE_IFLYTEK_API_SECRET as string

    const signatureOrigin = `host: ${host}\n` + `date: ${date}\n` + `GET ${path} HTTP/1.1`
    const signatureSha = await this.sha256HmacBase64(apiSecret, signatureOrigin)
    const authorizationOrigin = `api_key=\"${apiKey}\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"${signatureSha}\"`
    const authorization = btoa(authorizationOrigin)
    const url = `wss://${host}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`
    return url
  }

  private downsampleTo16k(input: Float32Array, inputSampleRate: number) {
    if (inputSampleRate === 16000) return input
    const sampleRateRatio = inputSampleRate / 16000
    const newLength = Math.round(input.length / sampleRateRatio)
    const result = new Float32Array(newLength)
    let offsetResult = 0
    let offsetBuffer = 0
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
      let accum = 0, count = 0
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
        accum += input[i]
        count++
      }
      result[offsetResult] = accum / count
      offsetResult++
      offsetBuffer = nextOffsetBuffer
    }
    return result
  }

  private floatTo16BitPCM(input: Float32Array) {
    const buffer = new ArrayBuffer(input.length * 2)
    const view = new DataView(buffer)
    let offset = 0
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return new Uint8Array(buffer)
  }

  private async startIflytek(onResult: (text: string) => void, onError?: (error: string) => void) {
    const url = await this.buildIflytekWsUrl()
    const appid = import.meta.env.VITE_IFLYTEK_APP_ID as string
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.ws = new WebSocket(url)
        this.ws.onopen = async () => {
          try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const source = this.audioContext.createMediaStreamSource(this.mediaStream)
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)
            source.connect(this.processor)
            this.processor.connect(this.audioContext.destination)

            let firstFrame = true
            this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
              if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
              const input = e.inputBuffer.getChannelData(0)
              const down = this.downsampleTo16k(input, this.audioContext!.sampleRate)
              const pcm = this.floatTo16BitPCM(down)
              const frame = btoa(String.fromCharCode(...pcm))
              const data = {
                common: firstFrame ? { app_id: appid } : undefined,
                business: firstFrame ? { language: 'zh_cn', domain: 'iat', accent: 'mandarin', dwa: 'wpgs' } : undefined,
                data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: frame }
              }
              this.ws!.send(JSON.stringify(data))
              firstFrame = false
            }

            resolve()
          } catch (err: any) {
            onError?.('麦克风初始化失败')
            reject(err)
          }
        }
        this.ws.onmessage = (evt) => {
          try {
            const res = JSON.parse(evt.data)
            if (res.code !== 0) {
              this.onErrorCallback?.(`ASR错误: ${res.code}`)
              return
            }
            if (res.data && res.data.result) {
              const ws = res.data.result.ws || []
              const txt = ws.map((w: any) => w.cw.map((c: any) => c.w).join('')).join('')
              if (txt) this.onResultCallback?.(txt)
            }
            if (res.data && res.data.status === 2) {
              this.stopIflytek()
            }
          } catch {}
        }
        this.ws.onerror = () => {
          onError?.('ASR连接错误')
        }
        this.ws.onclose = () => {
          this.cleanupAudio()
          this.ws = null
          this.isListening = false
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  private stopIflytek() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ data: { status: 2 } }))
      this.ws.close()
    }
    this.cleanupAudio()
  }

  private cleanupAudio() {
    if (this.processor) {
      this.processor.disconnect()
      this.processor.onaudioprocess = null as any
      this.processor = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop())
      this.mediaStream = null
    }
  }

  startListening(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (this.isListening) this.stopListening()
    this.onResultCallback = onResult
    this.onErrorCallback = onError
    this.isListening = true

    if (this.useIflytek) {
      this.startIflytek(onResult, onError).catch(() => {
        this.isListening = false
        onError?.('科大讯飞识别启动失败')
      })
      return
    }

    if (this.webSpeech) {
      try {
        this.webSpeech.onresult = (event: any) => {
          const result = event.results[0][0].transcript
          this.onResultCallback?.(result)
        }
        this.webSpeech.onerror = (event: any) => {
          this.onErrorCallback?.(event.error)
        }
        this.webSpeech.onend = () => {
          this.isListening = false
        }
        this.webSpeech.start()
      } catch (e) {
        onError?.('语音识别启动失败')
      }
      return
    }

    this.isListening = false
    onError?.('当前环境不支持语音识别')
  }

  stopListening() {
    if (this.useIflytek) {
      this.stopIflytek()
      this.isListening = false
      return
    }
    if (this.webSpeech && this.isListening) {
      this.webSpeech.stop()
      this.isListening = false
    }
  }

  getIsListening() {
    return this.isListening
  }
}

// 语音合成服务
export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis

  constructor() {
    this.synthesis = window.speechSynthesis
  }

  // 语音播报
  speak(text: string, lang = 'zh-CN') {
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

  // 停止播报
  stop() {
    this.synthesis.cancel()
  }
}

// 创建全局实例
export const speechRecognition = new SpeechRecognitionService()
export const speechSynthesis = new SpeechSynthesisService()
