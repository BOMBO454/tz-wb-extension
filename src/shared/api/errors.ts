import { HttpError } from '@/shared/api/http'

/** Domain error with stable code for UI / logging. */
export class AppError extends Error {
  readonly code: string

  constructor(code: string, message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined)
    this.name = 'AppError'
    this.code = code
  }
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true
  }
  return false
}

/** Russian user-facing message for any thrown value. */
export function toUserMessage(error: unknown, fallback = 'Произошла ошибка'): string {
  if (isAbortError(error)) {
    return 'Операция отменена'
  }

  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof HttpError) {
    if (error.status === 404) {
      return 'Данные не найдены'
    }
    if (error.status === 429) {
      return 'Слишком много запросов, попробуйте позже'
    }
    if (error.status >= 500) {
      return 'Сервер временно недоступен'
    }
    return `Ошибка сети (HTTP ${error.status})`
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}
