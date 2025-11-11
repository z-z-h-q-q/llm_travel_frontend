/**
 * 服务模块统一入口
 * 导出所有API服务和工具服务
 */

// 导入并导出基础API服务
import { api, API_CONFIG } from './api.js'
export { api, API_CONFIG }

// 导入并导出语音API服务
import { SpeechRecognitionApiService, speechApiService } from './speech-api.js'
export { SpeechRecognitionApiService, speechApiService }

// 导入并导出语音服务
import { 
  SpeechRecognitionService, 
  SpeechSynthesisService, 
  speechRecognition, 
  speechSynthesis 
} from './speech.js'
export { 
  SpeechRecognitionService, 
  SpeechSynthesisService, 
  speechRecognition, 
  speechSynthesis 
}

// 默认导出主要服务
export default {
  api,
  speechApiService,
  speechRecognition,
  speechSynthesis
}