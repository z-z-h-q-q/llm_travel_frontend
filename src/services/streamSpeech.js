/**
 * WebSocket 流式语音采集并发送到后端 /speech/stream 的工具
 *
 * 提供 startStreaming(wsUrl, callbacks) 和 stopStreaming() 两个函数。
 *
 * 实现要点：
 *  - 使用 WebAudio 捕获原始 PCM（Float32），对采样率做重采样到 16000Hz
 *  - 将每一帧编码为 16-bit PCM 并通过 WebSocket 以二进制发送
 *  - 接收后端转发的 JSON 消息（{type: 'partial'|'final', text, raw}) 并回调
 *
 * 浏览器兼容性：使用 ScriptProcessorNode 做兼容处理（AudioWorklet 更稳健，但工作量大）。
 */

let audioContext = null
let mediaStream = null
let sourceNode = null
let processorNode = null
let ws = null
let _onPartial = null
let _onFinal = null

function _downsampleBuffer(buffer, inSampleRate, outSampleRate) {
  if (outSampleRate === inSampleRate) {
    return buffer
  }
  const sampleRateRatio = inSampleRate / outSampleRate
  const newLength = Math.round(buffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    // Simple average between the two offsets
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]
      count++
    }
    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }
  return result
}

function _floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  let offset = 0
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    s = s < 0 ? s * 0x8000 : s * 0x7fff
    view.setInt16(offset, s, true) // little endian
  }
  return buffer
}

export async function startStreaming(wsUrl, { onPartial, onFinal, sampleRate = 16000 } = {}) {
  if (ws) {
    throw new Error('streaming already started')
  }
  _onPartial = onPartial
  _onFinal = onFinal

  ws = new WebSocket(wsUrl)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    console.log('[streamSpeech] ws open')
  }

  ws.onmessage = (ev) => {
    try {
      const msg = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
      if (msg && msg.type === 'partial') {
        _onPartial && _onPartial(msg.text, msg.raw)
      } else if (msg && msg.type === 'final') {
        _onFinal && _onFinal(msg.text, msg.raw)
      } else {
        // ignore or allow raw
        // console.debug('[streamSpeech] raw message', msg)
      }
    } catch (e) {
      console.warn('[streamSpeech] failed parse message', e)
    }
  }

  ws.onerror = (e) => {
    console.error('[streamSpeech] ws error', e)
  }

  ws.onclose = () => {
    console.log('[streamSpeech] ws closed')
  }

  // getUserMedia
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  // create source
  sourceNode = audioContext.createMediaStreamSource(mediaStream)

  // buffer size 4096 is a good tradeoff
  const bufferSize = 4096
  processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1)

  processorNode.onaudioprocess = (event) => {
    const inputBuffer = event.inputBuffer.getChannelData(0)
    const inSampleRate = audioContext.sampleRate
    const float32Data = (inSampleRate === sampleRate) ? inputBuffer : _downsampleBuffer(inputBuffer, inSampleRate, sampleRate)
    const arrayBuffer = _floatTo16BitPCM(float32Data)
    // send as binary
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(arrayBuffer)
      } catch (e) {
        console.error('[streamSpeech] ws send error', e)
      }
    }
  }

  sourceNode.connect(processorNode)
  processorNode.connect(audioContext.destination) // required in some browsers for onaudioprocess to run

  return {
    stop: () => stopStreaming(),
  }
}

export function stopStreaming() {
  if (!ws) return
  try {
    // notify EOS
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('EOS')
    }
    ws.close()
  } catch (e) {
    console.warn('[streamSpeech] ws close error', e)
  }
  ws = null

  try {
    if (processorNode) {
      processorNode.disconnect()
      processorNode.onaudioprocess = null
      processorNode = null
    }
    if (sourceNode) {
      sourceNode.disconnect()
      sourceNode = null
    }
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
    }
  } catch (e) {
    console.warn('[streamSpeech] cleanup error', e)
  }
}

export default {
  startStreaming,
  stopStreaming,
}
