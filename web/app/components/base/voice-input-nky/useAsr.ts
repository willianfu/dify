import { useCallback, useEffect, useRef } from 'react'

type AsrProps = {
  onReady: () => void;
  onText: (text: string) => void;
  onFinish: () => void;
  onError: (error: string) => void;
}

export const useAsr = ({ onText, onError, onReady, onFinish }: AsrProps) => {
  const wsRef = useRef<WebSocket | null>(null)

  const send = useCallback((data: any) => {
    if (!wsRef.current) return
    wsRef.current.send(data)
  }, [])

  const close = useCallback(() => {
    if (!wsRef.current) return
    wsRef.current.close()
  }, [])

  const finish = useCallback(() => {
    if (!wsRef.current) return
    wsRef.current.send(JSON.stringify({
      type: 'finish',
      data: 'finish',
    }))
  }, [])

  useEffect(() => {
    if (!wsRef.current)
      wsRef.current = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/asr`)

    const ws = wsRef.current
    ws.onopen = onReady

    ws.onerror = (error) => {
      console.error(error)
      onError('语音服务连接失败')
    }

    ws.onmessage = ({ data }) => {
      try {
        if (typeof data !== 'string') return
        const { type, data: value } = JSON.parse(data)
        switch (type) {
          case 'text':
            onText(value)
            break
          case 'finish':
            onFinish()
            break
          case 'error':
            onError(value)
            break
          default:
            console.log('未知事件：', type, value)
        }
      }
      catch (error: any) {
        onError(error?.message || 'JSON解析错误')
      }
    }

    window.addEventListener('beforeunload', close)
  }, [])
  return {
    send,
    close,
    finish,
  }
}
