import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private snack = inject(MatSnackBar);
  private shownSessionExpired = false;

  sessionExpiredOnce(): void {
    if (this.shownSessionExpired) return;
    this.shownSessionExpired = true;

    this.snack.open('Sessione scaduta. Effettua di nuovo l’accesso.', 'OK', {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  resetSessionExpiredFlag(): void {
    this.shownSessionExpired = false;
  }
}
