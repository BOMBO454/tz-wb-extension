import {
  CheckSquareOutlined,
  DownloadOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Alert, Button, Modal, Progress, Space, Spin, Typography } from 'antd'
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

function progressPercent(done: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return Math.round((done / total) * 100)
}

function modalTitle(
  media: { brand: string; name: string } | undefined,
  nm: number | null,
): string {
  if (media) {
    return `${media.brand} — ${media.name}`
  }
  if (nm) {
    return `Артикул ${nm}`
  }
  return 'Медиа карточки'
}

export function MediaDownloadModal({ open, nm, onClose }: MediaDownloadModalProps) {
  const mediaQuery = useProductMediaQuery(nm, open && nm !== null)
  const media = mediaQuery.data

  const selection = usePhotoSelection(media?.previewUrls.length ?? 0, media?.nm)
  const downloadPhotos = useDownloadPhotos()
  const downloadVideo = useDownloadVideo()

  const isBusy = downloadPhotos.isPending || downloadVideo.isPending
  const isLoading = mediaQuery.isPending || mediaQuery.isFetching

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

  const photosProgress = downloadPhotos.progress
  const videoProgress = downloadVideo.progress

  return (
    <Modal
      open={open}
      onCancel={isBusy ? undefined : onClose}
      title={modalTitle(media, nm)}
      width={880}
      footer={null}
      destroyOnHidden
      maskClosable={!isBusy}
      className="top-8"
    >
      {isLoading && !media && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <Typography.Text type="secondary">
            Загружаем карточку и CDN-маршруты…
          </Typography.Text>
        </div>
      )}

      {mediaQuery.isError && !media && (
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
              <Button size="small" onClick={selection.selectAll} disabled={isBusy}>
                Выбрать все
              </Button>
              <Button size="small" onClick={selection.clearAll} disabled={isBusy}>
                Снять все
              </Button>
            </Space>
          </div>

          <PhotoGrid
            previewUrls={media.previewUrls}
            selected={selection.selected}
            onToggle={selection.toggle}
          />

          {photosProgress && (
            <div>
              <Typography.Text type="secondary">
                Фото {photosProgress.done}/{photosProgress.total || '…'}
              </Typography.Text>
              <Progress
                percent={progressPercent(photosProgress.done, photosProgress.total)}
                size="small"
                status="active"
              />
            </div>
          )}

          {videoProgress && (
            <div>
              <Typography.Text type="secondary">
                Сегменты видео {videoProgress.done}/{videoProgress.total || '…'}
              </Typography.Text>
              <Progress
                percent={progressPercent(videoProgress.done, videoProgress.total)}
                size="small"
                status="active"
              />
            </div>
          )}

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
