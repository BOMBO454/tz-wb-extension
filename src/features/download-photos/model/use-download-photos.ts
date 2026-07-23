import { useCallback, useEffect, useRef, useState } from 'react'
import { App } from 'antd'
import { useMutation } from '@tanstack/react-query'

import { isAbortError, toUserMessage } from '@/shared/api/errors'
import { downloadPhotosMutationOptions } from '@/features/download-photos/model/download-photos-options'
import { downloadPhotosZip } from '@/features/download-photos/lib/download-photos-zip'

import type { DownloadPhotosVars } from '@/features/download-photos/model/download-photos-options'
import type { DownloadProgress } from '@/shared/lib/download/progress'

export function useDownloadPhotos() {
  const { message } = App.useApp()
  const [progress, setProgress] = useState<DownloadProgress>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const mutation = useMutation({
    ...downloadPhotosMutationOptions(),
    mutationFn: (vars: DownloadPhotosVars) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      return downloadPhotosZip({
        ...vars,
        signal: vars.signal ?? controller.signal,
        onProgress: setProgress,
      })
    },
    onMutate: () => {
      setProgress({ done: 0, total: 0, phase: 'fetch' })
    },
    onSuccess: (_data, vars) => {
      message.success(`Скачано фото: ${vars.urls.length}`)
    },
    onError: (error: Error) => {
      if (isAbortError(error)) {
        return
      }
      message.error(toUserMessage(error, 'Не удалось скачать фото'))
    },
    onSettled: () => {
      setProgress(null)
      abortRef.current = null
    },
  })

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    ...mutation,
    progress,
    cancel,
  }
}
