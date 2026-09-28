import axios from 'axios';
import { getLocale } from '@/i18n/locale';
import { useAdminAuth } from '@/stores/admin-auth';
import { useClientAuth } from '@/stores/client-auth';
import { normalizeApiError } from './errors';

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  config.headers.Accept = 'application/json';
  config.headers['Accept-Language'] = getLocale();

  const url = config.url ?? '';
  const token = url.startsWith('/admin')
    ? useAdminAuth.getState().token
    : url.startsWith('/client')
      ? useClientAuth.getState().token
      : null;                       // /public/* and /webhooks/* send no token
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);
    if (normalized.status === 401) {
      // clear the token of the guard that was used (by URL prefix) and redirect
      const url: string = error.config?.url ?? '';
      if (url.startsWith('/admin')) {
        useAdminAuth.getState().clear();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      } else if (url.startsWith('/client')) {
        useClientAuth.getState().clear();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(normalized);
  }
);
