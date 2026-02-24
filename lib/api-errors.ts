import { NextResponse } from 'next/server'

export const API_ERROR_CODES = {
  AUTH_REQUIRED: { status: 401, message: 'AUTH_REQUIRED' },
  FORBIDDEN: { status: 403, message: 'FORBIDDEN' },
  NOT_FOUND: { status: 404, message: 'NOT_FOUND' },
  VALIDATION_ERROR: { status: 400, message: 'VALIDATION_ERROR' },
  SERVER_ERROR: { status: 500, message: 'SERVER_ERROR' },
  INVALID_REQUEST: { status: 400, message: 'INVALID_REQUEST' },
} as const

export type ApiErrorCode = keyof typeof API_ERROR_CODES

export function apiError(code: ApiErrorCode) {
  const { status, message } = API_ERROR_CODES[code]
  return NextResponse.json({ success: false, error: message }, { status })
}
