import type { HostRange } from '@/shared/api/wb/types'
import type { VideoQuality } from '@/shared/config/wb'

export type ProductMedia = {
  nm: number
  name: string
  brand: string
  picsCount: number
  previewUrls: string[]
  downloadUrls: string[]
  hasVideo: boolean
  videoQuality: VideoQuality | null
  videoPlaylistUrl: string | null
  mediaRanges: HostRange[]
  videoRanges: HostRange[]
}

export type ProductPhoto = {
  index: number
  previewUrl: string
  downloadUrl: string
}
