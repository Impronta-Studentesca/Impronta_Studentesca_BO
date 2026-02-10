import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class WithCredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Applica solo alle chiamate API (evita assets e URL esterne)
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    return next.handle(req.clone({ withCredentials: true }));
  }
}
