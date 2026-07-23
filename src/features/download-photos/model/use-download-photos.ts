import { App } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { downloadPhotosMutationOptions } from '@/features/download-photos/model/download-photos-options'
import { downloadPhotosZip } from '@/features/download-photos/lib/download-photos-zip'

import type { DownloadPhotosVars } from '@/features/download-photos/model/download-photos-options'
import type { DownloadProgress } from '@/shared/lib/download/progress'

export function useDownloadPhotos() {
  const { message } = App.useApp()
  const [progress, setProgress] = useState<DownloadProgress>(null)

  const mutation = useMutation({
    ...downloadPhotosMutationOptions(),
    mutationFn: (vars: DownloadPhotosVars) =>
      downloadPhotosZip({
        ...vars,
        onProgress: (done, total) => {
          setProgress({ done, total })
        },
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

  return {
    ...mutation,
    progress,
  }
}
