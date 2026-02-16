import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {AuthErrorInterceptor} from "./core/interceptors/auth-error.interceptor";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {provideAnimations} from "@angular/platform-browser/animations";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {JwtInterceptor} from "./core/interceptors/jwt.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule),

    { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ]
};
