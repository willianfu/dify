import { useCallback, useRef, useState } from 'react'

type MicrophoneProps = {
  onAudioData: (data: Int16Array) => void,
  onRealTimeData: (data: Float32Array) => void
}

export const useMicrophone = ({ onAudioData, onRealTimeData }: MicrophoneProps) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const stopRecording = useCallback(() => {
    // 断开连接并释放资源
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect()
      processorNodeRef.current = null
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    // 关闭媒体流的所有轨道
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // 关闭音频上下文
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsRecording(false)
  }, [])
  const startRecording = useCallback(async () => {
    try {
      // 如果已经在录音，先停止
      if (audioContextRef.current)
        return

      if (!navigator.mediaDevices)
        throw new Error('浏览器不支持麦克风权限')

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      setIsRecording(true)
      // 创建音频上下文
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // 加载音频处理器
      await audioContext.audioWorklet.addModule('/audioProcessor.js')

      // 创建媒体流源节点
      const sourceNode = audioContext.createMediaStreamSource(stream)
      sourceNodeRef.current = sourceNode

      // 创建处理节点
      const processorNode = new AudioWorkletNode(audioContext, 'audio-processor')
      processorNodeRef.current = processorNode

      // 设置消息处理函数
      processorNode.port.onmessage = (event) => {
        const { type, data } = event.data

        if (type === 'time-domain') {
          // 当收到WAV格式数据时，提取Int16Array部分
          if (data instanceof Uint8Array && data.length > 44) { // WAV头部为44字节
            const headerSize = 44
            const audioData = new Int16Array(data.buffer.slice(headerSize))
            onAudioData(audioData)
          }
        }
        else if (type === 'frequency-domain') {
          onRealTimeData(data)
        }
      }

      // 连接节点
      sourceNode.connect(processorNode)
      processorNode.connect(audioContext.destination)
    }
    catch (error) {
      console.error('麦克风初始化失败:', error)
      stopRecording()
      setIsRecording(false)
    }
  }, [onAudioData, onRealTimeData])

  return {
    isRecording,
    startRecording,
    stopRecording,
  }
}
