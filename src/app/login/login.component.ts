import {Component, inject, OnInit} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth/auth.service';
import {NotifyService} from "../service/notify.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent{
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMsg: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
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
        error: (err) => {
          // qui puoi personalizzare in base al tuo backend (401 ecc.)
          this.errorMsg = 'Credenziali non valide o errore di connessione.';
          // console.log(err);
        },
      });
  }
}
