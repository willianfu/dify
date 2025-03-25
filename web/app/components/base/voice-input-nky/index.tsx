import { memo, useState } from 'react'
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

  return (
    <ActionButton
      size="l"
      onClick={() => {
        if (isRecording) {
          stopRecording()
          setIsRecording(false)
        }
        else {
          startRecording()
          setIsRecording(true)
        }
      }}
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
