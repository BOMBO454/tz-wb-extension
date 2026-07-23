import { useMutation } from '@tanstack/react-query'
import { App } from 'antd'
import { downloadProductVideo } from '@/features/download-video/lib/download-product-video'

type DownloadVideoVars = {
  playlistUrl: string
  nm: number
  quality: string
}

export function useDownloadVideo() {
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (vars: DownloadVideoVars) => downloadProductVideo(vars),
    onSuccess: (_data, vars) => {
      message.success(`Видео ${vars.quality} сохранено`)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Не удалось скачать видео')
    },
  })
}
