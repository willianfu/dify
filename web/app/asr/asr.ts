import { v4 as uuidv4 } from 'uuid'
import WebSocket from 'ws'

const ASR_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference'
const ASR_TOKEN = 'sk-7656cdb0f3a04cda93837b521190af21'

type AsrProps = {
  onText: (text: string) => void;
  onReady: () => void;
  onFinish: () => void;
  onError: (msg: string) => void;
}

export const startAsr = ({ onText, onError, onReady, onFinish }: AsrProps) => {
  let tempText = ''
  const textList: string[] = []
  const parseText = (text: string, isEnd: boolean) => {
    if (isEnd) {
      tempText = ''
      textList.push(text)
    }
    else {
      tempText += text
    }
    onText(textList.join('') + tempText)
  }

  // 生成任务ID
  const TASK_ID = uuidv4()
  const ws = new WebSocket(ASR_URL, {
    headers: {
      'Authorization': `bearer ${ASR_TOKEN}`,
      'X-DashScope-DataInspection': 'enable',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  let taskStarted = false

  ws.onopen = () => {
    // 发送run-task指令
    const runTaskMessage = {
      header: {
        action: 'run-task',
        task_id: TASK_ID,
        streaming: 'duplex',
      },
      payload: {
        task_group: 'audio',
        task: 'asr',
        function: 'recognition',
        model: 'paraformer-realtime-v2',
        parameters: {
          format: 'pcm',
        },
        input: {},
      },
    }
    ws.send(JSON.stringify(runTaskMessage))

    ws.onmessage = ({ data }) => {
      try {
        const message = JSON.parse(data.toString())
        const { text, end_time } = message?.payload?.output?.sentence || {}
        switch (message.header.event) {
          case 'task-started':
            taskStarted = true
            onReady()
            break
          case 'result-generated':
            parseText(text, end_time !== null)
            break
          case 'task-finished':
            onFinish()
            ws?.close()
            break
          case 'task-failed':
            onError(message.header.error_message || '语音识别失败')
            ws?.close()
            break
          default:
            console.log('未知事件：', message.header.event)
        }
      }
      catch (error) {
        onError(`解析消息失败: ${error}`)
      }
    }

    ws.onerror = (error) => {
      onError(`WebSocket错误: ${error}`)
    }

    ws.onclose = () => {
      if (!taskStarted)
        onError('连接已关闭，任务未能启动')
    }
  }

  const onAudio = (audio: Buffer) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      onError('WebSocket未连接')
      return
    }

    if (!taskStarted) {
      onError('任务尚未开始，请稍后再试')
      return
    }

    // 发送音频数据
    ws.send(audio)
  }

  const close = () => {
    if (!ws) return
    // 发送finish-task指令
    const finishTaskMessage = {
      header: {
        action: 'finish-task',
        task_id: TASK_ID,
        streaming: 'duplex',
      },
      payload: {
        input: {},
      },
    }
    ws.send(JSON.stringify(finishTaskMessage))
  }

  return {
    onAudio,
    close,
  }
}
