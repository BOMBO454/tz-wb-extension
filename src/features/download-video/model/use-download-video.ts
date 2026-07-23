import { useCallback, useEffect, useRef, useState } from 'react'
import { App } from 'antd'
import { useMutation } from '@tanstack/react-query'

import { isAbortError, toUserMessage } from '@/shared/api/errors'
import { downloadProductVideo } from '@/features/download-video/lib/download-product-video'
import { downloadVideoMutationOptions } from '@/features/download-video/model/download-video-options'

import type { DownloadProgress } from '@/shared/lib/download/progress'
import type { DownloadVideoVars } from '@/features/download-video/model/download-video-options'

export function useDownloadVideo() {
  const { message } = App.useApp()
  const [progress, setProgress] = useState<DownloadProgress>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const mutation = useMutation({
    ...downloadVideoMutationOptions(),
    mutationFn: (vars: DownloadVideoVars) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      return downloadProductVideo({
        ...vars,
        signal: vars.signal ?? controller.signal,
        onProgress: setProgress,
      })
    },
    onMutate: () => {
      setProgress({ done: 0, total: 0, phase: 'fetch' })
    },
    onSuccess: (_data, vars) => {
      message.success(`Видео ${vars.quality} сохранено`)
    },
    onError: (error: Error) => {
      if (isAbortError(error)) {
        return
      }
      message.error(toUserMessage(error, 'Не удалось скачать видео'))
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
