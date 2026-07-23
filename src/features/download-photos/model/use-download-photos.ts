import { useMutation } from '@tanstack/react-query'
import { App } from 'antd'
import { downloadPhotosZip } from '@/features/download-photos/lib/download-photos-zip'

type DownloadPhotosVars = {
  urls: string[]
  nm: number
}

export function useDownloadPhotos() {
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (vars: DownloadPhotosVars) => downloadPhotosZip(vars),
    onSuccess: (_data, vars) => {
      message.success(`Скачано фото: ${vars.urls.length}`)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Не удалось скачать фото')
    },
  })
}
