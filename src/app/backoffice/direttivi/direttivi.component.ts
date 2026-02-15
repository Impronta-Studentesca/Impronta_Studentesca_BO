import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, map, Subscription } from 'rxjs';

import { AuthService } from '../../service/auth/auth.service';
import { AdminService } from '../../service/admin/admin.service';
import {
  DirettivoRequestDTO,
  DirettivoResponseDTO,
  TipoDirettivo,
  TIPO_DIRETTIVO_LABEL
} from '../../model/direttivo.model';
import { extractApiErrorMessage } from '../../core/http-error';

import { DipartimentiService, DipartimentoDTO } from '../../service/dipartimenti/dipartimenti.service';

@Component({
  selector: 'app-direttivi',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './direttivi.component.html',
  styleUrl: './direttivi.component.scss',
})
export class DirettiviComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private admin = inject(AdminService);
  private dipService = inject(DipartimentiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  TIPO_DIRETTIVO_LABEL = TIPO_DIRETTIVO_LABEL;
  tipoOptions = Object.values(TipoDirettivo);

  direttivi: DirettivoResponseDTO[] = [];
  filtered: DirettivoResponseDTO[] = [];

  loading = false;
  errorMsg: string | null = null;

  private subFilters?: Subscription;
  private subTipo?: Subscription;

  isDirettivo$ = this.auth.currentUser$.pipe(
    map(u => {
      const ruoli = (u?.ruoli ?? []) as any;
      const arr = Array.isArray(ruoli) ? ruoli : Array.from(ruoli ?? []);
      return arr.includes('DIRETTIVO');
    })
  );

  filters = this.fb.group({
    attivo: [true],
    inizioDa: [''],
    fineA: [''],
  });

  modalOpen = false;
  editing: DirettivoResponseDTO | null = null;

  form = this.fb.group({
    tipo: [TipoDirettivo.GENERALE as TipoDirettivo, [Validators.required]],
    dipartimentoId: [null as number | null],
    inizioMandato: ['', [Validators.required]],
    fineMandato: [''],
  });

  // ✅ Dipartimenti per la select (mostro CODICE, salvo ID)
  dipartimentiOptions: DipartimentoDTO[] = [];
  loadingDipartimenti = false;
  private dipartimentiLoaded = false;

  // ✅ Modal conferma eliminazione
  deleteModalOpen = false;
  toDelete?: DirettivoResponseDTO;

  ngOnInit(): void {
    this.loadAll();

    this.subFilters = this.filters.valueChanges.subscribe(() => this.applyFilters());

    this.subTipo = this.form.get('tipo')!.valueChanges.subscribe((t) => {
      const dipCtrl = this.form.get('dipartimentoId')!;

      if (t === TipoDirettivo.DIPARTIMENTALE) {
        dipCtrl.setValidators([Validators.required]);
        this.loadDipartimenti(); // ✅ carico lista dipartimenti
      } else {
        dipCtrl.clearValidators();
        dipCtrl.setValue(null);
      }

      dipCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnDestroy(): void {
    this.subFilters?.unsubscribe();
    this.subTipo?.unsubscribe();
  }

  private loadDipartimenti(): void {
    if (this.dipartimentiLoaded || this.loadingDipartimenti) return;

    this.loadingDipartimenti = true;

    this.dipService.getAll()
      .pipe(finalize(() => (this.loadingDipartimenti = false)))
      .subscribe({
        next: (data) => {
          this.dipartimentiOptions = (data ?? [])
            .slice()
            .sort((a, b) => (a.codice ?? '').localeCompare(b.codice ?? ''));
          this.dipartimentiLoaded = true;
        },
        error: (err) => {
          // non blocco tutta la pagina, ma segnalo
          this.errorMsg = extractApiErrorMessage(err, 'Errore durante il recupero dei dipartimenti.');
          this.dipartimentiOptions = [];
          this.dipartimentiLoaded = false;
        },
      });
  }

  loadAll(): void {
    this.loading = true;
    this.errorMsg = null;

    this.admin.getDirettivi()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.direttivi = data ?? [];
          this.applyFilters();
        },
        error: (err) => (this.errorMsg = extractApiErrorMessage(err, 'Errore durante il recupero dei direttivi')),
      });
  }

  private applyFilters(): void {
    const f = this.filters.value;

    const onlyActive = !!f.attivo;
    const inizioDa = f.inizioDa ? new Date(f.inizioDa) : null;
    const fineA = f.fineA ? new Date(f.fineA) : null;

    this.filtered = (this.direttivi ?? []).filter(d => {
      if (onlyActive && !d.attivo) return false;

      const inizio = d.inizioMandato ? new Date(d.inizioMandato) : null;
      const fine = d.fineMandato ? new Date(d.fineMandato) : null;

      if (inizioDa && inizio && inizio < inizioDa) return false;
      if (fineA && fine && fine > fineA) return false;

      return true;
    });
  }

  cardTitle(d: DirettivoResponseDTO): string {
    const tipo = !d.dipartimentoId ? this.TIPO_DIRETTIVO_LABEL[d.tipo] : '';
    const ins = d.inizioMandato;
    const fin = d.fineMandato;
    const range = fin ? `dal ${ins} <br>al ${fin}` : `dal ${ins}`;
    const extra = d.dipartimentoId ? `${d.dipartimentoCodice}` : '';
    return `${tipo} ${extra}<br>${range}`;
  }

  openMembri(d: DirettivoResponseDTO): void {
    this.router.navigate(
      ['/backoffice/direttivi', d.id, 'membri'],
      { state: { direttivo: d } }
    );
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({
      tipo: TipoDirettivo.GENERALE,
      dipartimentoId: null,
      inizioMandato: '',
      fineMandato: '',
    });
    this.modalOpen = true;
  }

  openEdit(d: DirettivoResponseDTO): void {
    this.editing = d;

    // ✅ se è DIPARTIMENTALE, carico i dipartimenti per far funzionare la select
    if (d.tipo === TipoDirettivo.DIPARTIMENTALE) {
      this.loadDipartimenti();
    }

    this.form.setValue({
      tipo: d.tipo,
      dipartimentoId: (d.dipartimentoId ?? null) as any,
      inizioMandato: (d.inizioMandato ?? '').slice(0, 10),
      fineMandato: d.fineMandato ? d.fineMandato.slice(0, 10) : '',
    });

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

    const tipo = this.form.get('tipo')!.value as TipoDirettivo;
    const dipartimentoId =
      tipo === TipoDirettivo.DIPARTIMENTALE ? (this.form.get('dipartimentoId')!.value as number) : null;

    const payload: DirettivoRequestDTO = {
      id: this.editing?.id ?? null,
      tipo,
      dipartimentoId,
      inizioMandato: (this.form.get('inizioMandato')!.value ?? '').toString(),
      fineMandato: (this.form.get('fineMandato')!.value ?? '') || null,
    };

    this.loading = true;
    this.errorMsg = null;

    const req$ = this.editing
      ? this.admin.aggiornaDirettivo(payload)
      : this.admin.creaDirettivo(payload);

    req$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => { this.closeModal(); this.loadAll(); },
        error: (err) => (this.errorMsg = extractApiErrorMessage(err, 'Operazione non riuscita.')),
      });
  }

  openDeleteModal(d: DirettivoResponseDTO): void {
    this.toDelete = d;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.toDelete = undefined;
  }

  confirmDelete(): void {
    if (!this.toDelete) return;

    this.loading = true;
    this.errorMsg = null;

    this.admin.eliminaDirettivo(this.toDelete.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.loadAll();
        },
        error: (err) => {
          this.closeDeleteModal();
          this.errorMsg = extractApiErrorMessage(err, 'Eliminazione non riuscita.');
        },
      });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.deleteModalOpen) this.closeDeleteModal();
    else if (this.modalOpen) this.closeModal();
  }
}
