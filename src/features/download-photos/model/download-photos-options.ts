import { mutationOptions } from '@tanstack/react-query'

import { downloadPhotosZip } from '@/features/download-photos/lib/download-photos-zip'

export type DownloadPhotosVars = {
  urls: string[]
  nm: number
}

export const downloadPhotosKeys = {
  all: ['download', 'photos'] as const,
}

/** Shared options for photo zip mutation (useMutation / useIsMutating). */
export function downloadPhotosMutationOptions() {
  return mutationOptions({
    mutationKey: downloadPhotosKeys.all,
    mutationFn: (vars: DownloadPhotosVars) => downloadPhotosZip(vars),
  })
}
