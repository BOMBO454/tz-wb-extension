export type DownloadPhase = 'fetch' | 'remux' | 'zip'

export type DownloadProgress = {
  done: number
  total: number
  phase?: DownloadPhase
} | null
