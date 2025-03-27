'use client'
import type { FC } from 'react'
import classNames from '@/utils/classnames'
import { useChatWithHistoryContext } from '../chat/chat-with-history/context'

type LogoSiteProps = {
  className?: string
}

const LogoSite: FC<LogoSiteProps> = ({
  className,
}) => {
  const {
    appData,
  } = useChatWithHistoryContext()
  return (
    <img
      src={appData?.site.icon_url ?? '/logo/logo.png'}
      className={classNames('block w-[22.651px] h-[24.5px]', className)}
      alt='logo'
    />
  )
}

export default LogoSite
