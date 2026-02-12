import { Routes } from '@angular/router';

export const BACKOFFICE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },

  {
    path: 'dipartimenti',
    loadComponent: () =>
      import('./dipartimenti/dipartimenti.component').then(m => m.DipartimentiComponent),
  },

  {
    path: 'dipartimenti/:dipartimentoId/corsi',
    loadComponent: () => import('./corsi/corsi.component').then(m => m.CorsiComponent),
  },

  {
    path: 'staff',
    loadComponent: () =>
      import('./staff/staff.component').then(m => m.StaffComponent),
  },

  {
    path: 'direttivi',
    loadComponent: () => import('./direttivi/direttivi.component').then(m => m.DirettiviComponent),
  },
  {
    path: 'direttivi/:direttivoId/membri',
    loadComponent: () => import('./membri-direttivo/membri-direttivo.component').then(m => m.MembriDirettivoComponent),
  },
];
