import { memo, useCallback, useState } from 'react'
import ActionButton, {
  ActionButtonState,
} from '@/app/components/base/action-button'
import { useMicrophone } from './useMicrophone'
import { useAsr } from './useAsr'
import { Icon } from '@iconify/react'
import Toast from '@/app/components/base/toast'
export type VoiceInputProps = {
  onConverted: (text: string) => void;
}

const VoiceInput = memo(({ onConverted }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const {
    send: sendAudio,
    close: closeWs,
    finish: finishAsr,
  } = useAsr({
    onText: onConverted,
    onError: (error) => {
      Toast.notify({
        type: 'error',
        message: error,
      })
    },
    onReady: () => {},
    onFinish: () => {},
  })
  const { startRecording, stopRecording } = useMicrophone({
    onAudioData: sendAudio,
    onRealTimeData: () => {},
  })

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording() // 停止录音
      finishAsr() // 结束语音识别
      setIsRecording(false)
      return
    }
    startRecording() // 开始录音
    setIsRecording(true)
  }, [isRecording])

  // // 组件卸载时关闭ws
  // useEffect(() => {
  //   return ()=> closeWs()
  // }, [])

  return (
    <ActionButton
      size="l"
      onClick={() => handleToggleRecording()}
      state={isRecording ? ActionButtonState.Active : ActionButtonState.Default}
    >
      <Icon
        icon={isRecording ? 'svg-spinners:bars-scale-middle' : 'lucide:mic'}
        className="text-xl"
      />
    </ActionButton>
  )
})
VoiceInput.displayName = 'VoiceInput'
export default VoiceInput
