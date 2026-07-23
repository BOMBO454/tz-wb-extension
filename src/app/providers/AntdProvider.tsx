import { App, ConfigProvider } from 'antd'
import type { ReactNode } from 'react'

import ruRU from 'antd/locale/ru_RU'

import { wbTheme } from '@/app/providers/wb-theme'

type AntdProviderProps = {
  children: ReactNode
}

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider locale={ruRU} theme={wbTheme}>
      <App>{children}</App>
    </ConfigProvider>
  )
}
