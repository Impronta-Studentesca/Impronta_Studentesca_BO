import { HttpErrorResponse } from '@angular/common/http';

function tryParseJson(s: string): any | null {
  try { return JSON.parse(s); } catch { return null; }
}

export function extractApiErrorMessage(err: unknown, fallback = 'Operazione non riuscita.'): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;

  const body: any = err.error;

  // 1) Se è una stringa (tipo text/plain o html), prova a usarla o a parse-izzarla
  if (typeof body === 'string') {
    const parsed = tryParseJson(body);
    if (parsed && typeof parsed === 'object') {
      return parsed.message || parsed.error || parsed.detail || fallback;
    }
    // stringa “pulita”
    return body || fallback;
  }

  // 2) JSON classico del tuo handler
  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.error === 'string' && body.error.trim()) return body.error;
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;

    // 3) Validazioni tipo { errors: [...] }
    if (Array.isArray(body.errors) && body.errors.length) {
      return body.errors.map((x: any) => x?.message ?? String(x)).join(', ');
    }
  }

  // 4) Fallback su messaggio “generico” Angular
  return err.message || fallback;
}
