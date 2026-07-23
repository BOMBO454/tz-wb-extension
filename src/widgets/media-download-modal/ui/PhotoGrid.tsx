import { CheckCircleFilled } from '@ant-design/icons'
import { Image } from 'antd'

type PhotoGridProps = {
  previewUrls: string[]
  selected: Set<number>
  onToggle: (index: number) => void
}

export function PhotoGrid({ previewUrls, selected, onToggle }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {previewUrls.map((url, index) => {
        const isSelected = selected.has(index)
        const borderClass = isSelected
          ? 'border-blue-500 shadow-sm'
          : 'border-transparent opacity-80 hover:opacity-100'

        return (
          <button
            key={url}
            type="button"
            onClick={() => onToggle(index)}
            className={`group relative overflow-hidden rounded-lg border-2 bg-white p-0 text-left transition ${borderClass}`}
            aria-pressed={isSelected}
            aria-label={`Фото ${index + 1}${isSelected ? ', выбрано' : ''}`}
          >
            <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-100">
              <Image
                src={url}
                alt={`Фото ${index + 1}`}
                preview={false}
                className="!h-full !w-full object-cover"
                rootClassName="!block !h-full !w-full"
              />
            </div>

            {isSelected && (
              <CheckCircleFilled className="absolute right-2 top-2 text-xl text-blue-500 drop-shadow" />
            )}

            <span className="absolute bottom-1 left-2 rounded bg-black/50 px-1.5 text-xs text-white">
              {index + 1}
            </span>
          </button>
        )
      })}
    </div>
  )
}
