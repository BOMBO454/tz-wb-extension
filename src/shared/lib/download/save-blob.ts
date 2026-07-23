import { saveAs } from 'file-saver'

export function saveBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}
