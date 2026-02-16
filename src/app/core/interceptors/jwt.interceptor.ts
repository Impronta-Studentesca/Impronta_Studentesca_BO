import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const raw = localStorage.getItem('impronta_user');
    const token = raw ? (JSON.parse(raw)?.token as string | undefined) : undefined;

    // se non c'è token, vai avanti
    if (!token) return next.handle(req);

    // opzionale: non aggiungerlo su endpoint auth pubblici
    const isAuthEndpoint = req.url.includes(`/${environment.api.authPath}/login`);
    if (isAuthEndpoint) return next.handle(req);

    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });

    return next.handle(authReq);
  }
}
