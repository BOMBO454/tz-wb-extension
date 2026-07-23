import { Alert, Button, Modal, Progress, Space, Spin, Typography } from 'antd'
import {
  CheckSquareOutlined,
  DownloadOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'

import { PhotoGrid } from '@/widgets/media-download-modal/ui/PhotoGrid'
import { toUserMessage } from '@/shared/api/errors'
import { useMediaDownloadModal } from '@/widgets/media-download-modal/model/use-media-download-modal'

import type { DownloadPhase, DownloadProgress } from '@/shared/lib/download/progress'

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

function phaseLabel(phase: DownloadPhase | undefined, kind: 'photos' | 'video'): string {
  if (phase === 'zip') {
    return 'Собираем ZIP…'
  }
  if (phase === 'remux') {
    return 'Собираем MP4…'
  }
  if (kind === 'photos') {
    return 'Загрузка фото'
  }
  return 'Сегменты видео'
}

function ProgressBlock({
  progress,
  kind,
}: {
  progress: NonNullable<DownloadProgress>
  kind: 'photos' | 'video'
}) {
  const isIndeterminate =
    progress.phase === 'remux' || progress.phase === 'zip' || progress.total <= 0

  return (
    <div>
      <Typography.Text type="secondary">
        {phaseLabel(progress.phase, kind)}
        {!isIndeterminate && ` ${progress.done}/${progress.total}`}
      </Typography.Text>
      <Progress
        percent={isIndeterminate ? 100 : progressPercent(progress.done, progress.total)}
        size="small"
        status="active"
        showInfo={!isIndeterminate}
      />
    </div>
  )
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
  const {
    mediaQuery,
    media,
    selection,
    downloadPhotos,
    downloadVideo,
    isBusy,
    isLoading,
    downloadSelectedPhotos,
    downloadMediaVideo,
  } = useMediaDownloadModal(nm, open)

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
          description={toUserMessage(mediaQuery.error, 'Неизвестная ошибка')}
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

          {photosProgress && <ProgressBlock progress={photosProgress} kind="photos" />}
          {videoProgress && <ProgressBlock progress={videoProgress} kind="video" />}

          <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloadPhotos.isPending}
              disabled={selection.selectedCount === 0 || isBusy}
              onClick={downloadSelectedPhotos}
            >
              Скачать фото ({selection.selectedCount})
            </Button>

            <Button
              icon={<VideoCameraOutlined />}
              loading={downloadVideo.isPending}
              disabled={!media.hasVideo || isBusy}
              onClick={downloadMediaVideo}
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
