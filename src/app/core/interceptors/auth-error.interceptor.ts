import { Injectable, inject } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';
import { NotifyService } from '../../service/notify.service';

@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && (err.status === 401 )) {

          // se eri loggato (anche solo localmente) mostra avviso una volta
          const wasLogged = !!this.auth.getCurrentUser();

          // pulisci subito lo stato UI
          this.auth.forceLogoutLocal();

          if (wasLogged) {
            this.notify.sessionExpiredOnce();
          }

          // redirect alla login (anche se sei già lì, non fa danni)
          if (!this.router.url.startsWith('/login')) {
            // micro-delay per evitare collisioni con change detection/hydration
            setTimeout(() => this.router.navigateByUrl('/login'), 0);
          }

          return EMPTY;
        }

        return throwError(() => err);
      })
    );
  }
}
