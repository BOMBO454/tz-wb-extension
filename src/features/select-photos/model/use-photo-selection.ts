import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Multi-select for photo indexes. All selected by default when list changes.
 */
export function usePhotoSelection(photoCount: number) {
  const allIndexes = useMemo(
    () => Array.from({ length: photoCount }, (_, index) => index),
    [photoCount],
  )

  const [selected, setSelected] = useState<Set<number>>(() => new Set(allIndexes))

  useEffect(() => {
    setSelected(new Set(allIndexes))
  }, [allIndexes])

  const toggle = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(allIndexes))
  }, [allIndexes])

  const clearAll = useCallback(() => {
    setSelected(new Set())
  }, [])

  const selectedIndexes = useMemo(
    () => allIndexes.filter((index) => selected.has(index)),
    [allIndexes, selected],
  )

  return {
    selected,
    selectedIndexes,
    toggle,
    selectAll,
    clearAll,
    isAllSelected: selected.size === photoCount && photoCount > 0,
    selectedCount: selected.size,
  }
}
