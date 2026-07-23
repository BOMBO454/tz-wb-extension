import { mutationOptions } from '@tanstack/react-query'

import { downloadProductVideo } from '@/features/download-video/lib/download-product-video'

export type DownloadVideoVars = {
  playlistUrl: string
  nm: number
  quality: string
  signal?: AbortSignal
}

export const downloadVideoKeys = {
  all: ['download', 'video'] as const,
}

/** Shared options for HLS→MP4 download mutation. */
export function downloadVideoMutationOptions() {
  return mutationOptions({
    mutationKey: downloadVideoKeys.all,
    mutationFn: (vars: DownloadVideoVars) => downloadProductVideo(vars),
  })
}
