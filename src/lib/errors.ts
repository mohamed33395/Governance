import { AxiosError } from 'axios';

export type ApiError = {
  status: number;                   // HTTP status (0 = network error)
  code: string;                     // error_code, e.g. 'SLOT_NOT_AVAILABLE', or 'NETWORK_ERROR'
  message: string;                  // translated, safe to toast
  errors: Record<string, string[]>; // field errors for VALIDATION_ERROR, else {}
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'تحقق من اتصالك بالإنترنت',
        errors: {},
      };
    }
    const body = error.response.data as
      | { message?: string; error_code?: string; errors?: Record<string, string[]> }
      | null
      | undefined;
    return {
      status: error.response.status,
      code: body?.error_code ?? 'SERVER_ERROR',
      message: body?.message ?? error.message,
      errors: body?.errors ?? {},
    };
  }
  return { status: 0, code: 'UNKNOWN_ERROR', message: String(error), errors: {} };
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'code' in error && 'status' in error;
}
