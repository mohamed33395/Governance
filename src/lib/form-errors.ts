import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from './errors';

// 422 VALIDATION_ERROR → inline field errors from `errors`
export function applyValidationErrors<T extends FieldValues>(setError: UseFormSetError<T>, error: ApiError) {
  Object.entries(error.errors).forEach(([field, messages]) => {
    setError(field as Path<T>, { type: 'server', message: messages[0] });
  });
}
