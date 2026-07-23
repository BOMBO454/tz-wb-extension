import {
  CheckSquareOutlined,
  DownloadOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Alert, Button, Modal, Space, Spin, Typography } from 'antd'
import { useProductMediaQuery } from '@/entities/product'
import { useDownloadPhotos } from '@/features/download-photos'
import { useDownloadVideo } from '@/features/download-video'
import { usePhotoSelection } from '@/features/select-photos'
import { PhotoGrid } from '@/widgets/media-download-modal/ui/PhotoGrid'

type MediaDownloadModalProps = {
  open: boolean
  nm: number | null
  onClose: () => void
}

export function MediaDownloadModal({ open, nm, onClose }: MediaDownloadModalProps) {
  const mediaQuery = useProductMediaQuery(nm, open && nm !== null)
  const media = mediaQuery.data
  // no data + no error while modal is open => still loading (upstreams or card)
  const isMediaLoading = open && nm !== null && !media && !mediaQuery.isError

  const selection = usePhotoSelection(media?.previewUrls.length ?? 0)
  const downloadPhotos = useDownloadPhotos()
  const downloadVideo = useDownloadVideo()

  const isBusy = downloadPhotos.isPending || downloadVideo.isPending

  const handleDownloadPhotos = () => {
    if (!media) {
      return
    }

    const urls = selection.selectedIndexes
      .map((index) => media.downloadUrls[index])
      .filter((url): url is string => Boolean(url))

    downloadPhotos.mutate({ urls, nm: media.nm })
  }

  const handleDownloadVideo = () => {
    if (!media?.videoPlaylistUrl || !media.videoQuality) {
      return
    }

    downloadVideo.mutate({
      playlistUrl: media.videoPlaylistUrl,
      nm: media.nm,
      quality: media.videoQuality,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={isBusy ? undefined : onClose}
      title={
        media
          ? `${media.brand} — ${media.name}`
          : nm
            ? `Артикул ${nm}`
            : 'Медиа карточки'
      }
      width={880}
      footer={null}
      destroyOnHidden
      maskClosable={!isBusy}
      className="top-8"
    >
      {isMediaLoading && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <Typography.Text type="secondary">
            Загружаем карточку и CDN-маршруты…
          </Typography.Text>
        </div>
      )}

      {mediaQuery.isError && (
        <Alert
          type="error"
          showIcon
          message="Не удалось получить медиа"
          description={
            mediaQuery.error instanceof Error
              ? mediaQuery.error.message
              : 'Неизвестная ошибка'
          }
        />
      )}

      {media && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Typography.Text type="secondary">
              Фото: {media.picsCount}
              {media.hasVideo
                ? ` · видео: ${media.videoQuality}`
                : ' · видео нет'}
              {' · '}
              выбрано {selection.selectedCount}
            </Typography.Text>

            <Space wrap>
              <Button size="small" onClick={selection.selectAll}>
                Выбрать все
              </Button>
              <Button size="small" onClick={selection.clearAll}>
                Снять все
              </Button>
            </Space>
          </div>

          <PhotoGrid
            previewUrls={media.previewUrls}
            selected={selection.selected}
            onToggle={selection.toggle}
          />

          <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloadPhotos.isPending}
              disabled={selection.selectedCount === 0 || isBusy}
              onClick={handleDownloadPhotos}
            >
              Скачать фото ({selection.selectedCount})
            </Button>

            <Button
              icon={<VideoCameraOutlined />}
              loading={downloadVideo.isPending}
              disabled={!media.hasVideo || isBusy}
              onClick={handleDownloadVideo}
            >
              {media.hasVideo
                ? `Скачать видео (${media.videoQuality})`
                : 'Видео недоступно'}
            </Button>

            <Button
              icon={<CheckSquareOutlined />}
              disabled={isBusy}
              onClick={onClose}
            >
              Закрыть
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
