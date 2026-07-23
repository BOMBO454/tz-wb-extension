import { Card, Typography } from 'antd'

import { ArticleForm } from '@/widgets/article-form'
import { MediaDownloadModal } from '@/widgets/media-download-modal'
import { useHomePage } from '@/pages/home/model/use-home-page'

export function HomePage() {
  const { nm, modalOpen, openMediaForArticle, closeModal } = useHomePage()

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
      <Card className="shadow-sm">
        <Typography.Title level={2} className="!mb-1">
          Скачать фото / видео с WB
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-6">
          Введите артикул карточки Wildberries — откроется окно с выбором фото и
          скачиванием медиа.
        </Typography.Paragraph>

        <ArticleForm onSubmit={openMediaForArticle} />
      </Card>

      <MediaDownloadModal open={modalOpen} nm={nm} onClose={closeModal} />
    </div>
  )
}
