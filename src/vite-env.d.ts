/// <reference types="vite/client" />

declare module 'mux.js' {
  export namespace mp4 {
    class Transmuxer {
      constructor(options?: { keepOriginalTimestamps?: boolean })
      on(event: 'data', callback: (segment: TransmuxerSegment) => void): void
      on(event: 'done', callback: () => void): void
      on(event: 'error', callback: (error: unknown) => void): void
      push(data: Uint8Array | ArrayBuffer): void
      flush(): void
      dispose(): void
    }
  }

  export interface TransmuxerSegment {
    data: ArrayBuffer
    initSegment?: ArrayBuffer
    type?: string
  }

  const muxjs: {
    mp4: typeof mp4
  }

  export default muxjs
}
