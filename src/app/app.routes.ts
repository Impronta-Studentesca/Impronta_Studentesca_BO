import { Routes } from '@angular/router';
import { authGuard } from './service/auth/auth.guard';
import {loginGuard} from "./service/auth/login.guard";
import {PasswordSetPageComponent} from "./password-set-page/password-set-page.component";

export const routes: Routes = [

  {
    path: 'password/:action/:personaId',
    component: PasswordSetPageComponent,
    title: 'password',
  },
  {
    path: 'backoffice',
    canActivate: [authGuard],
    loadChildren: () => import('./backoffice/backoffice.routes').then(m => m.BACKOFFICE_ROUTES),
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {path: '',
    canActivate: [loginGuard],
    loadComponent: () => import('./welcome/welcome.component').then(m => m.WelcomeComponent),
  },

  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '', pathMatch: 'full' },

];

