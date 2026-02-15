import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../service/auth/auth.service';
import { PasswordAction } from '../model/password.model';
import { passwordMatchValidator } from '../shared/validators/password-match.validator';

@Component({
  selector: 'app-password-set-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './password-set-page.component.html',
  styleUrl: './password-set-page.component.scss',
})
export class PasswordSetPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  action!: PasswordAction; // 'crea' | 'modifica'
  personaId!: number;
  token!: string;

  isLoading = false;
  success = false;
  invalidLink = false;
  errorMsg: string | null = null;

  showPassword = false;
  showConfirm = false;

  /**
   * Regole:
   * - almeno 8 caratteri
   * - almeno 1 numero
   * - almeno 1 carattere speciale (non lettera/numero e non spazio)
   */
  private static readonly PASSWORD_COMPLEXITY_REGEX =
    /^(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

  form = this.fb.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(PasswordSetPageComponent.PASSWORD_COMPLEXITY_REGEX),
        ],
      ],
      confirmPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(PasswordSetPageComponent.PASSWORD_COMPLEXITY_REGEX),
        ],
      ],
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') }
  );

  ngOnInit(): void {
    // PATH params (nuovo formato)
    const actionFromPath = (this.route.snapshot.paramMap.get('action') || '').trim();
    const personaIdFromPath = (this.route.snapshot.paramMap.get('personaId') || '').trim();

    // QUERY params (vecchio formato)
    const actionFromQuery =
      (this.route.snapshot.queryParamMap.get('azione') ||
        this.route.snapshot.queryParamMap.get('action') ||
        '').trim();

    const personaIdFromQuery = (this.route.snapshot.queryParamMap.get('personaId') || '').trim();

    const tokenParam = (this.route.snapshot.queryParamMap.get('token') || '').trim();

    // scegli il primo disponibile
    const rawAction = (actionFromPath || actionFromQuery).toLowerCase();
    const rawPersonaId = personaIdFromPath || personaIdFromQuery;

    // normalizza action: supporta CREA/MODIFICA, crea/modifica
    const normalizedAction =
      rawAction === 'crea' || rawAction === 'create' || rawAction === 'creapassword'
        ? 'crea'
        : rawAction === 'modifica' || rawAction === 'update' || rawAction === 'modificapassword'
          ? 'modifica'
          : rawAction; // fallback

    if (normalizedAction !== 'crea' && normalizedAction !== 'modifica') {
      this.invalidLink = true;
      this.errorMsg = 'Link non valido: azione mancante o errata.';
      return;
    }
    this.action = normalizedAction as PasswordAction;

    const parsedId = Number(rawPersonaId);
    if (!rawPersonaId || Number.isNaN(parsedId) || parsedId <= 0) {
      this.invalidLink = true;
      this.errorMsg = 'Link non valido: ID persona mancante o errato.';
      return;
    }
    this.personaId = parsedId;

    if (!tokenParam) {
      this.invalidLink = true;
      this.errorMsg = 'Link non valido: token mancante o errato.';
      return;
    }
    this.token = tokenParam;
  }

  get title(): string {
    return this.action === 'crea' ? 'Crea la tua password' : 'Modifica la tua password';
  }

  submit(): void {
    this.errorMsg = null;
    this.success = false;

    if (this.invalidLink) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const password = this.form.value.password!;
    this.isLoading = true;

    const request$ =
      this.action === 'crea'
        ? this.authService.creaPassword(this.personaId, password, this.token)
        : this.authService.modificaPassword(this.personaId, password, this.token);

    request$
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => (this.success = true),
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Errore durante il salvataggio della password.';
          this.errorMsg = msg;
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirm(): void {
    this.showConfirm = !this.showConfirm;
  }
}
