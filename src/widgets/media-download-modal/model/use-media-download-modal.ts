import { useEffect } from 'react'

import { useDownloadPhotos } from '@/features/download-photos'
import { useDownloadVideo } from '@/features/download-video'
import { usePhotoSelection } from '@/features/select-photos'
import { useProductMediaQuery } from '@/entities/product'

/**
 * Composes TanStack queries/mutations + photo selection for the media modal.
 * UI stays thin; all server/async state lives in TQ-based hooks.
 */
export function useMediaDownloadModal(nm: number | null, open: boolean) {
  const mediaQuery = useProductMediaQuery(nm, open && nm !== null)
  const media = mediaQuery.data

  const selection = usePhotoSelection(media?.previewUrls.length ?? 0, media?.nm)
  const downloadPhotos = useDownloadPhotos()
  const downloadVideo = useDownloadVideo()

  const cancelPhotos = downloadPhotos.cancel
  const cancelVideo = downloadVideo.cancel

  const isBusy = downloadPhotos.isPending || downloadVideo.isPending
  // v5: isLoading = isPending && isFetching (false when query is disabled)
  const isLoading = mediaQuery.isLoading

  // Cancel in-flight downloads when modal closes
  useEffect(() => {
    if (!open) {
      cancelPhotos()
      cancelVideo()
    }
  }, [open, cancelPhotos, cancelVideo])

  const downloadSelectedPhotos = () => {
    if (!media) {
      return
    }

    const urls = selection.selectedIndexes
      .map((index) => media.downloadUrls[index])
      .filter((url): url is string => Boolean(url))

    downloadPhotos.mutate({ urls, nm: media.nm })
  }

  const downloadMediaVideo = () => {
    if (!media?.videoPlaylistUrl || !media.videoQuality) {
      return
    }

    downloadVideo.mutate({
      playlistUrl: media.videoPlaylistUrl,
      nm: media.nm,
      quality: media.videoQuality,
    })
  }

  return {
    mediaQuery,
    media,
    selection,
    downloadPhotos,
    downloadVideo,
    isBusy,
    isLoading,
    downloadSelectedPhotos,
    downloadMediaVideo,
  }
}
