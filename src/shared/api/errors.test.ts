import { describe, expect, it } from 'vitest'

import { AppError, isAbortError, toUserMessage } from '@/shared/api/errors'
import { HttpError } from '@/shared/api/http'

describe('toUserMessage', () => {
  it('maps AppError message', () => {
    expect(toUserMessage(new AppError('X', 'Пользовательский текст'))).toBe(
      'Пользовательский текст',
    )
  })

  it('maps HttpError statuses', () => {
    expect(toUserMessage(new HttpError(404, '/x'))).toBe('Данные не найдены')
    expect(toUserMessage(new HttpError(503, '/x'))).toBe('Сервер временно недоступен')
  })

  it('maps abort', () => {
    expect(toUserMessage(new DOMException('Aborted', 'AbortError'))).toBe(
      'Операция отменена',
    )
  })
})

describe('isAbortError', () => {
  it('detects AbortError name', () => {
    const err = new Error('stop')
    err.name = 'AbortError'
    expect(isAbortError(err)).toBe(true)
    expect(isAbortError(new Error('other'))).toBe(false)
  })
})
