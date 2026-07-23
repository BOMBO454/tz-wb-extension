import { App, ConfigProvider } from 'antd'
import type { ReactNode } from 'react'

import ruRU from 'antd/locale/ru_RU'

type AntdProviderProps = {
  children: ReactNode
}

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
