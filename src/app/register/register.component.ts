import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { DipartimentiService, DipartimentoDTO } from '../service/dipartimenti/dipartimenti.service';
import { CorsiService } from '../service/corsi/corsi.service';
import { AuthService } from '../service/auth/auth.service';

import { PersonaRequestDTO } from '../model/persona.model';
import { CorsoDiStudiRequestDTO, CorsoDiStudiResponseDTO, TipoCorso } from '../model/corsi.model';
import { TIPO_CORSO_LABEL } from '../core/constants/tipo-corso-label';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dipSvc = inject(DipartimentiService);
  private corsiSvc = inject(CorsiService);
  private authSvc = inject(AuthService);

  // UI
  loading = false;
  corsiLoading = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;

  dipList: DipartimentoDTO[] = [];
  corsiList: CorsoDiStudiResponseDTO[] = [];
  selectedCorso: CorsoDiStudiResponseDTO | null = null;

  // label map come negli altri componenti
  TIPO_CORSO_LABEL = TIPO_CORSO_LABEL;

  // come in CorsiComponent (ma filtrato per evitare enum numerici)
  tipoCorsoOptions: TipoCorso[] = (Object.values(TipoCorso) as unknown[])
    .filter((x): x is TipoCorso => typeof x === 'string');

  // ✅ MODALE "Nuovo corso"
  modalOpen = false;

  corsoForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    tipoCorso: [TipoCorso.TRIENNALE as TipoCorso, [Validators.required]],
  });

  // ✅ se valorizzato => l'utente sta proponendo un nuovo corso
  corsoDraft: CorsoDiStudiRequestDTO | null = null;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    cognome: ['', [Validators.required, Validators.minLength(2)]],
    matricola:['', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]],
    numeroTelefono:['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
    email: ['', [Validators.required, Validators.email]],
    mailUnipa: ['', [Validators.required, Validators.email]],

    dipartimentoId: [null as number | null, Validators.required],
    corsoDiStudiId: [{ value: null as number | null, disabled: true }, Validators.required],

    annoCorso: [null as number | null, Validators.required],
    staff: [false],
  });

  private dipSub?: Subscription;
  private corsoSub?: Subscription;
  private dipLoadSub?: Subscription;
  private corsiLoadSub?: Subscription;

  ngOnInit(): void {
    this.loadDipartimenti();
    this.setupSubs();
  }

  ngOnDestroy(): void {
    this.dipSub?.unsubscribe();
    this.corsoSub?.unsubscribe();
    this.dipLoadSub?.unsubscribe();
    this.corsiLoadSub?.unsubscribe();
  }

  private extractApiMessage(err: any, fallback: string): string {
    const e = err?.error;
    return e?.message || e?.error || e?.detail || err?.message || fallback;
  }

  // ---------------- load dip/corsi ----------------
  private loadDipartimenti(): void {
    this.dipLoadSub?.unsubscribe();
    this.dipLoadSub = this.dipSvc.getAll().subscribe({
      next: (d) => (this.dipList = d ?? []),
      error: (err) => (this.errorMsg = this.extractApiMessage(err, 'Errore durante il caricamento dei dipartimenti.')),
    });
  }

  private setupSubs(): void {
    this.dipSub?.unsubscribe();
    this.dipSub = this.form.controls.dipartimentoId.valueChanges.subscribe((dipId) => {
      this.errorMsg = null;
      this.successMsg = null;

      // reset corsi + selezioni
      this.corsiList = [];
      this.selectedCorso = null;
      this.corsoDraft = null;

      this.form.controls.corsoDiStudiId.reset(null, { emitEvent: false });
      this.form.controls.corsoDiStudiId.disable({ emitEvent: false });

      if (!dipId) return;
      this.loadCorsi(dipId);
    });

    this.corsoSub?.unsubscribe();
    this.corsoSub = this.form.controls.corsoDiStudiId.valueChanges.subscribe(() => {
      // se seleziono un corso esistente => corsoDraft deve diventare null
      const id = this.form.controls.corsoDiStudiId.value;
      this.selectedCorso = id ? this.corsiList.find((c) => c.id === id) ?? null : null;
      if (id) this.corsoDraft = null;
    });
  }

  private loadCorsi(dipId: number): void {
    this.corsiLoading = true;

    this.corsiLoadSub?.unsubscribe();
    this.corsiLoadSub = this.corsiSvc
      .getByDipartimento(dipId)
      .pipe(finalize(() => (this.corsiLoading = false)))
      .subscribe({
        next: (c) => {
          this.corsiList = c ?? [];
          if (this.corsiList.length > 0) {
            this.form.controls.corsoDiStudiId.enable({ emitEvent: false });
          }
        },
        error: (err) => (this.errorMsg = this.extractApiMessage(err, 'Errore durante il caricamento dei corsi di studio.')),
      });
  }

  // ---------------- MODALE corso (SOLO UI, niente chiamate API) ----------------
  openCreateCorso(): void {
    const dipId = this.form.controls.dipartimentoId.value;
    if (!dipId) {
      this.errorMsg = 'Seleziona prima un dipartimento.';
      return;
    }

    this.errorMsg = null;

    this.corsoForm.reset({
      nome: this.corsoDraft?.nome ?? '',
      tipoCorso: this.corsoDraft?.tipoCorso ?? TipoCorso.TRIENNALE,
    });

    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  saveCorsoDraft(): void {
    if (this.corsoForm.invalid) {
      this.corsoForm.markAllAsTouched();
      return;
    }

    const dipId = this.form.controls.dipartimentoId.value;
    if (!dipId) {
      this.errorMsg = 'Seleziona prima un dipartimento.';
      return;
    }

    const nome = (this.corsoForm.get('nome')?.value ?? '').trim();
    const tipoCorso = this.corsoForm.get('tipoCorso')?.value as TipoCorso;

    this.corsoDraft = {
      nome,
      tipoCorso,
      dipartimentoId: dipId,
    } as CorsoDiStudiRequestDTO;

    this.selectedCorso = null;

    // importante: azzero e disabilito davvero il controllo
    this.form.controls.corsoDiStudiId.reset(null, { emitEvent: false });
    this.form.controls.corsoDiStudiId.disable({ emitEvent: false });

    this.closeModal();
  }

  clearCorsoDraft(): void {
    this.corsoDraft = null;

    // se ci sono corsi disponibili, riabilito la select
    if (this.corsiList.length > 0) {
      this.form.controls.corsoDiStudiId.enable({ emitEvent: false });
    }
  }

  // ---------------- SUBMIT ----------------
  canSubmit(): boolean {
    // devo avere: form valido + (corso selezionato) oppure (corsoDraft presente)
    const baseValid = this.form.valid;
    const hasExisting = !!this.form.controls.corsoDiStudiId.value;
    const hasDraft = !!this.corsoDraft;
    return baseValid && (hasExisting || hasDraft);
  }

  submit(): void {
    this.errorMsg = null;
    this.successMsg = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const useDraft = !!this.corsoDraft;

    // PersonaRequestDTO: se corsoDraft esiste => corsoDiStudiId null
    const personaDto: PersonaRequestDTO = {
      nome: (v.nome ?? '').trim(),
      cognome: (v.cognome ?? '').trim(),
      matricola: v.matricola!,
      numeroTelefono: v.numeroTelefono!,
      email: v.email!,
      mailUnipa: v.mailUnipa!,
      corsoDiStudiId: useDraft ? null : (v.corsoDiStudiId as any),
      annoCorso: v.annoCorso ?? null,
      staff: !!v.staff,
      ruoli: [],
    } as any;

    // CorsoDiStudiRequestDTO: valorizzato SOLO se corsoDraft presente
    const corsoDto: CorsoDiStudiRequestDTO | null = useDraft ? this.corsoDraft : null;

    if (!useDraft && !v.corsoDiStudiId) {
      this.errorMsg = 'Seleziona un corso di studi oppure creane uno nuovo.';
      return;
    }

    this.loading = true;
    this.authSvc
      .creaPersona(personaDto, corsoDto)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMsg = 'Registrazione inviata! Attendi approvazione.';
          this.corsoDraft = null;
          this.selectedCorso = null;

          this.form.reset(
            {
              nome: '',
              cognome: '',
              email: '',
              dipartimentoId: null,
              corsoDiStudiId: { value: null, disabled: true } as any,
              annoCorso: null,
              staff: false,
            },
            { emitEvent: false }
          );
        },
        error: (err) => (this.errorMsg = this.extractApiMessage(err, 'Errore durante la registrazione.')),
      });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.modalOpen) this.closeModal();
  }
}
