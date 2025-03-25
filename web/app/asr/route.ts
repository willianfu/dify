import { startAsr } from './asr'
export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
) {
  let isReady = false
  let asr: ReturnType<typeof startAsr> | null = null
  let cache: Buffer[] = []
  const initAsr = () => {
    asr = startAsr({
      onText: (text) => {
        client.send(JSON.stringify({
          type: 'text',
          data: text,
        }))
      },
      onReady: () => {
        isReady = true
        client.send(JSON.stringify({
          type: 'ready',
          data: 'ready',
        }))
        if (cache.length > 0) {
          // 将缓存中的音频数据转换为Uint8Array
          // @ts-expect-error
          asr?.onAudio(Buffer.concat(cache))
          cache = []
        }
      },
      onError: (error) => {
        isReady = false
        cache = []
        client.send(JSON.stringify({
          type: 'error',
          data: error,
        }))
      },
      onFinish: () => {
        isReady = false
        cache = []
        client.send(JSON.stringify({
          type: 'finish',
          data: 'finish',
        }))
        asr = null
      },
    })
  }

  client.on('message', (data, isBinary) => {
    if (!(data instanceof Buffer)) return
    if (isBinary) {
      if (asr === null) initAsr() // 如果asr未初始化，则初始化
      if (!isReady) return cache.push(data) // 如果asr未就绪，则缓存音频数据
      return asr?.onAudio(data) // 如果asr已就绪，则发送音频数据
    }
    try {
      const { type } = JSON.parse(data.toString())
      switch (type) {
        case 'finish':
          asr?.close()
          break
      }
    }
    catch (error) {
      client.send(JSON.stringify({
        type: 'error',
        data: error,
      }))
    }
  })

  client.on('close', () => {
    asr?.close()
  })
}
