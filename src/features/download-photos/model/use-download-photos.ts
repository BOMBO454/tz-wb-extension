import { useMutation } from '@tanstack/react-query'
import { App } from 'antd'
import { useCallback, useState } from 'react'
import { downloadPhotosZip } from '@/features/download-photos/lib/download-photos-zip'
import type { DownloadProgress } from '@/shared/lib/download/progress'

type DownloadPhotosVars = {
  urls: string[]
  nm: number
}

export function useDownloadPhotos() {
  const { message } = App.useApp()
  const [progress, setProgress] = useState<DownloadProgress>(null)

  const mutation = useMutation({
    mutationFn: (vars: DownloadPhotosVars) =>
      downloadPhotosZip({
        ...vars,
        onProgress: (done, total) => setProgress({ done, total }),
      }),
    onMutate: () => {
      setProgress({ done: 0, total: 0 })
    },
    onSuccess: (_data, vars) => {
      message.success(`Скачано фото: ${vars.urls.length}`)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Не удалось скачать фото')
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
