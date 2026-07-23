import { HomePage } from '@/pages/home'
import { AntdProvider } from '@/app/providers/AntdProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'

export function App() {
  return (
    <QueryProvider>
      <AntdProvider>
        <HomePage />
      </AntdProvider>
    </QueryProvider>
  )
}
