import { memo } from 'react'
import { RiSendPlane2Fill } from '@remixicon/react'
import type { EnableType } from '../../types'
import type { Theme } from '../../embedded-chatbot/theme/theme-context'
import Button from '@/app/components/base/button'
import { FileUploaderInChatInput } from '@/app/components/base/file-uploader'
import type { FileUpload } from '@/app/components/base/features/types'
import cn from '@/utils/classnames'

import VoiceInput from '@/app/components/base/voice-input-nky'

type OperationProps = {
  fileConfig?: FileUpload;
  speechToTextConfig?: EnableType;
  onTextConverted: (text: string) => void;
  onSend: () => void;
  theme?: Theme | null;
}
const Operation = ({
  ref,
  fileConfig,
  speechToTextConfig,
  onTextConverted,
  onSend,
  theme,
}: OperationProps & {
  ref: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div className={cn('flex shrink-0 items-center justify-end')}>
      <div className="flex items-center pl-1" ref={ref}>
        <div className="flex items-center space-x-1">
          {fileConfig?.enabled && (
            <FileUploaderInChatInput fileConfig={fileConfig} />
          )}
          {speechToTextConfig?.enabled && (
            <VoiceInput onConverted={onTextConverted} />
          )}
        </div>
        <Button
          className="ml-3 w-8 px-0"
          variant="primary"
          onClick={onSend}
          style={
            theme
              ? {
                backgroundColor: theme.primaryColor,
              }
              : {}
          }
        >
          <RiSendPlane2Fill className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
Operation.displayName = 'Operation'

export default memo(Operation)
