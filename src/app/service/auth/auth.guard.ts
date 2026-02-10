import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (): any => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn$.pipe(
    take(1),
    map((logged): boolean | UrlTree => {
      if (logged) return true;
      return router.createUrlTree(['']);
    })
  );
};
