import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, map } from 'rxjs';

import { AuthService } from '../../service/auth/auth.service';
import {
  DipartimentiService,
  DipartimentoDTO,
  DipartimentoRequestDTO
} from '../../service/dipartimenti/dipartimenti.service';
import {extractApiErrorMessage} from "../../core/http-error";

@Component({
  selector: 'app-dipartimenti',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dipartimenti.component.html',
  styleUrl: './dipartimenti.component.scss',
})
export class DipartimentiComponent implements OnInit {
  private auth = inject(AuthService);
  private svc = inject(DipartimentiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  dipartimenti: DipartimentoDTO[] = [];
  loading = false;
  errorMsg: string | null = null;

  // ✅ solo DIRETTIVO vede i comandi admin
  isDirettivo$ = this.auth.currentUser$.pipe(
    map(u => {
      const ruoli = (u?.ruoli ?? []) as any;
      const arr = Array.isArray(ruoli) ? ruoli : Array.from(ruoli ?? []);
      return arr.includes('DIRETTIVO');
    })
  );

  // Modal create/edit
  modalOpen = false;
  editing: DipartimentoDTO | null = null;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    codice: ['', [Validators.required, Validators.minLength(2)]],
  });

  // ✅ Modal conferma eliminazione
  deleteModalOpen = false;
  toDelete?: DipartimentoDTO;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMsg = null;

    this.svc.getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.dipartimenti = data ?? []),
        error: (err) => (this.errorMsg = extractApiErrorMessage(err, 'Errore nel recupero dei dipartimenti')),
      });
  }

  // --- UI actions ---
  openCreate(): void {
    this.editing = null;
    this.form.reset({ nome: '', codice: '' });
    this.modalOpen = true;
  }

  openEdit(d: DipartimentoDTO): void {
    this.editing = d;
    this.form.setValue({ nome: d.nome, codice: d.codice });
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editing = null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nome = (this.form.get('nome')?.value ?? '').trim();
    const codice = (this.form.get('codice')?.value ?? '').trim().toUpperCase();

    const payload = {
      id: this.editing?.id,
      nome,
      codice,
    };

    this.loading = true;
    this.errorMsg = null;

    const req$ = this.editing
      ? this.svc.update(payload)
      : this.svc.create({ nome, codice });

    req$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => { this.closeModal(); this.loadAll(); },
        error: (err) => {
          this.closeDeleteModal();
          this.errorMsg = extractApiErrorMessage(err, 'Operazione non riuscita.')},
      });
  }

  // ✅ al posto di confirm()
  openDeleteModal(d: DipartimentoDTO): void {
    this.toDelete = d;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.toDelete = undefined;
  }

  confirmDelete(): void {
    if (!this.toDelete) return;

    const payload: DipartimentoRequestDTO = {
      id: this.toDelete.id,
      nome: this.toDelete.nome,
      codice: this.toDelete.codice,
    };

    this.loading = true;
    this.errorMsg = null;

    this.svc.delete(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.loadAll();
        },
        error: (err) => {
          this.closeDeleteModal();
          this.errorMsg = extractApiErrorMessage(err, 'Eliminazione non riuscita.')
        },
      });
  }

  // Click card → corsi
  openCorsi(d: DipartimentoDTO): void {
    this.router.navigate(
      ['/backoffice/dipartimenti', d.id, 'corsi'],
      { state: { dipartimentoNome: d.nome, dipartimentoCodice: d.codice } }
    );
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.deleteModalOpen) this.closeDeleteModal();
    else if (this.modalOpen) this.closeModal();
  }
}
