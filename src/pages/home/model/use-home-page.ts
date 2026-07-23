import { useState } from 'react'

import { usePrefetchProductMedia } from '@/entities/product'

/**
 * Home flow: article → prefetch media into TQ cache → open modal.
 */
export function useHomePage() {
  const [nm, setNm] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const prefetchProductMedia = usePrefetchProductMedia()

  const openMediaForArticle = (article: number) => {
    setNm(article)
    setModalOpen(true)
    void prefetchProductMedia(article)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  return {
    nm,
    modalOpen,
    openMediaForArticle,
    closeModal,
  }
}
