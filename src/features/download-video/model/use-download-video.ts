import { useMutation } from '@tanstack/react-query'
import { App } from 'antd'
import { useCallback, useState } from 'react'
import { downloadProductVideo } from '@/features/download-video/lib/download-product-video'
import type { DownloadProgress } from '@/shared/lib/download/progress'

type DownloadVideoVars = {
  playlistUrl: string
  nm: number
  quality: string
}

export function useDownloadVideo() {
  const { message } = App.useApp()
  const [progress, setProgress] = useState<DownloadProgress>(null)

  const mutation = useMutation({
    mutationFn: (vars: DownloadVideoVars) =>
      downloadProductVideo({
        ...vars,
        onProgress: (done, total) => setProgress({ done, total }),
      }),
    onMutate: () => {
      setProgress({ done: 0, total: 0 })
    },
    onSuccess: (_data, vars) => {
      message.success(`Видео ${vars.quality} сохранено`)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Не удалось скачать видео')
    },
    onSettled: () => {
      setProgress(null)
    },
  })

  const resetProgress = useCallback(() => setProgress(null), [])

  return {
    ...mutation,
    progress,
    resetProgress,
  }
}
