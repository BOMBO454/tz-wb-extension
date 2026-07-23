import { App } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { downloadProductVideo } from '@/features/download-video/lib/download-product-video'
import { downloadVideoMutationOptions } from '@/features/download-video/model/download-video-options'

import type { DownloadProgress } from '@/shared/lib/download/progress'
import type { DownloadVideoVars } from '@/features/download-video/model/download-video-options'

export function useDownloadVideo() {
  const { message } = App.useApp()
  const [progress, setProgress] = useState<DownloadProgress>(null)

  const mutation = useMutation({
    ...downloadVideoMutationOptions(),
    mutationFn: (vars: DownloadVideoVars) =>
      downloadProductVideo({
        ...vars,
        onProgress: (done, total) => {
          setProgress({ done, total })
        },
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

  return {
    ...mutation,
    progress,
  }
}
