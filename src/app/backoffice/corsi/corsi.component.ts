import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, map, switchMap } from 'rxjs';
import { Location } from '@angular/common';

import { AuthService } from '../../service/auth/auth.service';
import { CorsiService } from '../../service/corsi/corsi.service';
import { CorsoDiStudiRequestDTO, CorsoDiStudiResponseDTO, TipoCorso } from '../../model/corsi.model';
import { TIPO_CORSO_LABEL } from '../../core/constants/tipo-corso-label';
import {extractApiErrorMessage} from "../../core/http-error";

@Component({
  selector: 'app-corsi',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './corsi.component.html',
  styleUrl: './corsi.component.scss',
})
export class CorsiComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private corsiSvc = inject(CorsiService);
  private location = inject(Location);

  dipartimentoId!: number;
  dipartimentoNome!: string;
  dipartimentoCodice!: string;

  corsi: CorsoDiStudiResponseDTO[] = [];
  loading = false;
  errorMsg: string | null = null;

  TIPO_CORSO_LABEL = TIPO_CORSO_LABEL;
  tipoCorsoOptions = Object.values(TipoCorso);

  isDirettivo$ = this.auth.currentUser$.pipe(
    map(u => {
      const ruoli = (u?.ruoli ?? []) as any;
      const arr = Array.isArray(ruoli) ? ruoli : Array.from(ruoli ?? []);
      return arr.includes('DIRETTIVO');
    })
  );

  modalOpen = false;
  editing: CorsoDiStudiResponseDTO | null = null;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    tipoCorso: [TipoCorso.TRIENNALE as TipoCorso, [Validators.required]],
  });

  // ✅ Modal conferma eliminazione
  deleteModalOpen = false;
  toDelete?: CorsoDiStudiResponseDTO;

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state as any) ?? this.location.getState();

    this.dipartimentoNome = state?.dipartimentoNome ?? '';
    this.dipartimentoCodice = state?.dipartimentoCodice ?? '';

    this.route.paramMap
      .pipe(
        map(pm => Number(pm.get('dipartimentoId'))),
        switchMap((id) => {
          this.dipartimentoId = id;
          return this.loadAll$();
        })
      )
      .subscribe();
  }

  private loadAll$() {
    this.loading = true;
    this.errorMsg = null;

    return this.corsiSvc.getByDipartimento(this.dipartimentoId).pipe(
      finalize(() => (this.loading = false)),
      map((data) => {
        this.corsi = data ?? [];
        return data;
      })
    );
  }

  reload(): void {
    this.loadAll$().subscribe();
  }

  back(): void {
    this.router.navigate(['/backoffice/dipartimenti']);
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ nome: '', tipoCorso: TipoCorso.TRIENNALE });
    this.modalOpen = true;
  }

  openEdit(c: CorsoDiStudiResponseDTO): void {
    this.editing = c;
    this.form.setValue({ nome: c.nome, tipoCorso: c.tipoCorso });
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
    const tipoCorso = this.form.get('tipoCorso')?.value as TipoCorso;

    const payload: CorsoDiStudiRequestDTO = {
      id: this.editing?.id,
      nome,
      tipoCorso,
      dipartimentoId: this.dipartimentoId,
    };

    this.loading = true;
    this.errorMsg = null;

    const req$ = this.editing
      ? this.corsiSvc.update(payload)
      : this.corsiSvc.create(payload);

    req$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => { this.closeModal(); this.reload(); },
        error: (err) => (this.errorMsg = extractApiErrorMessage(err, 'Eliminazione non riuscita.')),
      });
  }

  // ✅ al posto di confirm()
  openDeleteModal(c: CorsoDiStudiResponseDTO): void {
    this.toDelete = c;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.toDelete = undefined;
  }

  confirmDelete(): void {
    if (!this.toDelete) return;

    const payload: CorsoDiStudiRequestDTO = {
      id: this.toDelete.id,
      nome: this.toDelete.nome,
      tipoCorso: this.toDelete.tipoCorso,
      dipartimentoId: this.dipartimentoId,
    };

    this.loading = true;
    this.errorMsg = null;

    this.corsiSvc.delete(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.reload();
        },
        error: (err) => {
          this.closeDeleteModal();
          this.errorMsg = extractApiErrorMessage(err, 'Eliminazione non riuscita.')},
      });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.deleteModalOpen) this.closeDeleteModal();
    else if (this.modalOpen) this.closeModal();
  }
}
