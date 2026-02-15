import { Component, HostListener, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth/auth.service';
import { extractApiErrorMessage } from '../core/http-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMsg: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  // --- Forgot password modal state ---
  forgotOpen = false;
  forgotLoading = false;
  forgotSuccess = false;
  forgotErrorMsg: string | null = null;

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    this.errorMsg = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      email: this.form.value.email!.trim(),
      password: this.form.value.password!,
    };

    this.loading = true;

    this.auth
      .login(dto)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/backoffice/dashboard'),
        error: (err) => (this.errorMsg = extractApiErrorMessage(err, 'Credenziali errate.')),
      });
  }

  openForgot(): void {
    this.forgotOpen = true;
    this.forgotLoading = false;
    this.forgotSuccess = false;
    this.forgotErrorMsg = null;
    this.forgotForm.reset({ email: this.form.value.email?.trim() || '' });
  }

  closeForgot(): void {
    this.forgotOpen = false;
  }

  submitForgot(): void {
    this.forgotErrorMsg = null;

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.forgotForm.value.email!.trim();
    this.forgotLoading = true;

    this.auth
      .richiestaModificaPassword(email)
      .pipe(finalize(() => (this.forgotLoading = false)))
      .subscribe({
        next: () => {
          // Messaggio “non enumerante” (standard)
          this.forgotSuccess = true;
        },
        error: (err) => {
          this.forgotErrorMsg = extractApiErrorMessage(
            err,
            'Errore durante la richiesta di modifica password.'
          );
        },
      });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.forgotOpen) this.closeForgot();
  }
}
