import { environment } from '../environments/environment';

export const apiUrl = (...parts: Array<string | number>) => {
  const host = (environment.apiHost ?? '').replace(/\/+$/, '');
  const base = (environment.api.basePath ?? '').replace(/^\/+|\/+$/g, '');

  const path = parts
    .filter(p => String(p).trim() !== '')
    .map(p => String(p).replace(/^\/+|\/+$/g, ''))
    .join('/');

  const full = [host, base, path].filter(Boolean).join('/');

  // se non c'è host (proxy), garantisci URL assoluta relativa alla root: "/..."
  return host ? full : `/${full}`.replace(/\/{2,}/g, '/');
};
