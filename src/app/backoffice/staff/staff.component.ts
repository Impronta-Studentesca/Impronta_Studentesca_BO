import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, startWith, Subscription } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { StaffService } from '../../service/staff/staff.service';
import { AuthService } from '../../service/auth/auth.service';
import { StaffCardDTO } from '../../model/staff.model';

import { DipartimentiService, DipartimentoDTO } from '../../service/dipartimenti/dipartimenti.service';
import { CorsiService } from '../../service/corsi/corsi.service';
import { CorsoDiStudiResponseDTO, TipoCorso } from '../../model/corsi.model';

import { AdminService } from '../../service/admin/admin.service';
import { PersonaRequestDTO, Ruolo } from '../../model/persona.model';

import { StaffEditModalComponent } from '../staff-edit-modal/staff-edit-modal.component';

import { TIPO_CORSO_LABEL } from '../../core/constants/tipo-corso-label';

type CurrentUserLite =
  | {
  id?: number | string;
  personaId?: number | string;
  userId?: number | string;
  utenteId?: number | string;
  email?: string;
  username?: string;
  ruoli?: string[];
  persona?: { id?: number | string };
  user?: { id?: number | string };
}
  | null;

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, AsyncPipe, ReactiveFormsModule, StaffEditModalComponent],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
})
export class StaffComponent implements OnInit, OnDestroy {
  private staffService = inject(StaffService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  private dipSvc = inject(DipartimentiService);
  private corsiSvc = inject(CorsiService);
  private adminService = inject(AdminService);

  // ---- EDIT MODAL STATE ----
  editOpen = false;
  editPersona: StaffCardDTO | null = null;
  editMe: CurrentUserLite = null;
  editIsDir = false;

  // --- Modale conferma elimina persona ---
  deleteModalOpen = false;
  toDelete: StaffCardDTO | null = null;
  deletingPersona = false;


  loading = true;
  errorMsg = '';
  staff: StaffCardDTO[] = [];

  private brokenPhotos = new Set<number>();

  // AUTH
  currentUser$: Observable<CurrentUserLite> = this.auth.currentUser$ as Observable<CurrentUserLite>;

  isDirettivo$: Observable<boolean> = this.currentUser$.pipe(
    map((u) => {
      const ruoli: string[] = u?.ruoli ?? [];
      return ruoli.includes('DIRETTIVO') || ruoli.includes('DIRETTIVO_DIPARTIMENTALE');
    })
  );

  vm$: Observable<{ me: CurrentUserLite; isDir: boolean }> = combineLatest([
    this.currentUser$,
    this.isDirettivo$,
  ]).pipe(map(([me, isDir]) => ({ me, isDir })));

  // FILTRI
  filterForm = this.fb.group({
    dipartimentoId: [''],
    corsoId: [''],
    anno: [''],
    search: [''],
  });

  dipartimenti: { id: number; nome: string; codice?: string }[] = [];
  corsi: { id: number; nome: string; dipartimentoId?: number; tipoCorso?: TipoCorso }[] = [];
  anni: number[] = [];

  filtered$ = this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.value),
    map((f) => {
      const dipId = f.dipartimentoId ? Number(f.dipartimentoId) : null;
      const corsoId = f.corsoId ? Number(f.corsoId) : null;
      const anno = f.anno ? Number(f.anno) : null;
      const q = (f.search ?? '').trim().toLowerCase();

      return this.staff.filter((s) => {
        const sDipId = s.corsoDiStudi?.dipartimento?.id ?? null;
        const sCorsoId = s.corsoDiStudi?.id ?? null;

        if (dipId && sDipId !== dipId) return false;
        if (corsoId && sCorsoId !== corsoId) return false;
        if (anno && (s.annoCorso ?? null) !== anno) return false;

        if (q) {
          const full = `${s.nome} ${s.cognome}`.toLowerCase();
          const ruoloDir = (s.direttivoRuoli ?? []).join(' ').toLowerCase();
          const reps = (s.rappresentanze ?? []).join(' ').toLowerCase();
          const corso = (s.corsoDiStudi?.nome ?? '').toLowerCase();
          const dipNome = (s.corsoDiStudi?.dipartimento?.nome ?? '').toLowerCase();

          if (![full, ruoloDir, reps, corso, dipNome].some((x) => x.includes(q))) return false;
        }
        return true;
      });
    })
  );

  // MODAL CREATE
  modalOpen = false;
  saving = false;

  dipList: DipartimentoDTO[] = [];
  corsiList: CorsoDiStudiResponseDTO[] = [];
  corsiLoading = false;

  selectedCorso: CorsoDiStudiResponseDTO | null = null;

  readonly TIPO_CORSO_LABEL = TIPO_CORSO_LABEL;
  protected readonly TipoCorso = TipoCorso;

  private staffListSub?: Subscription;

  private dipLoadSub?: Subscription;
  private corsiLoadSub?: Subscription;

  private dipChangeSub?: Subscription;
  private staffChangeSub?: Subscription;
  private corsoChangeSub?: Subscription;

  createForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    cognome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],

    dipartimentoId: [null as number | null, Validators.required],
    corsoDiStudiId: [{ value: null as number | null, disabled: true }, Validators.required],

    annoCorso: [null as number | null],
    staff: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.staffListSub?.unsubscribe();

    this.dipLoadSub?.unsubscribe();
    this.corsiLoadSub?.unsubscribe();

    this.dipChangeSub?.unsubscribe();
    this.staffChangeSub?.unsubscribe();
    this.corsoChangeSub?.unsubscribe();
  }

  private load(): void {
    this.loading = true;
    this.errorMsg = '';

    this.staffListSub?.unsubscribe();
    this.staffListSub = this.staffService.getStaff().subscribe({
      next: (data) => {
        this.staff = (data ?? []).slice();
        this.buildFilterOptions();
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Errore durante il caricamento dello staff.';
        this.loading = false;
      },
    });
  }

  private buildFilterOptions(): void {
    const dipMap = new Map<number, { id: number; nome: string; codice?: string }>();
    const corsoMap = new Map<number, { id: number; nome: string; dipartimentoId?: number; tipoCorso?: TipoCorso }>();
    const anniSet = new Set<number>();

    for (const s of this.staff) {
      if (typeof s.annoCorso === 'number') anniSet.add(s.annoCorso);

      const corso = s.corsoDiStudi;
      if (!corso?.id) continue;

      const dip = corso.dipartimento ?? null;
      const dipId = dip?.id ?? undefined;

      corsoMap.set(corso.id, {
        id: corso.id,
        nome: corso.nome,
        dipartimentoId: dipId,
        tipoCorso: (corso as any)?.tipoCorso,
      });

      if (dip?.id && dip?.nome) {
        dipMap.set(dip.id, { id: dip.id, nome: dip.nome, codice: dip.codice });
      }
    }

    this.dipartimenti = Array.from(dipMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    this.corsi = Array.from(corsoMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    this.anni = Array.from(anniSet.values()).sort((a, b) => a - b);
  }

  // PERMESSI
  private getUserId(u: CurrentUserLite): number | null {
    const raw = u?.id ?? u?.personaId ?? u?.userId ?? u?.utenteId ?? u?.persona?.id ?? u?.user?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private getStaffId(s: StaffCardDTO): number | null {
    const raw = (s as any)?.id ?? (s as any)?.personaId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  canManageCard(staff: StaffCardDTO, currentUser: CurrentUserLite, isDirettivo: boolean): boolean {
    if (isDirettivo) return true;
    if (!currentUser) return false;

    const uid = this.getUserId(currentUser);
    const sid = this.getStaffId(staff);

    if (uid != null && sid != null) return uid === sid;

    const uEmail = String(currentUser.email ?? currentUser.username ?? '').toLowerCase();
    const sEmail = String((staff as any)?.mail ?? (staff as any)?.email ?? '').toLowerCase(); // ✅ mail prima di email
    return !!uEmail && !!sEmail && uEmail === sEmail;
  }

  // CREATE
  openCreate(): void {
    this.errorMsg = '';
    this.modalOpen = true;
    this.saving = false;

    this.corsiLoading = false;
    this.corsiList = [];
    this.selectedCorso = null;

    this.createForm.reset({
      nome: '',
      cognome: '',
      email: '',
      dipartimentoId: null,
      corsoDiStudiId: null,
      annoCorso: null,
      staff: true,
    });

    this.createForm.controls.corsoDiStudiId.disable({ emitEvent: false });

    this.dipLoadSub?.unsubscribe();
    this.dipLoadSub = this.dipSvc.getAll().subscribe({
      next: (d) => (this.dipList = d ?? []),
      error: () => (this.errorMsg = 'Errore durante il caricamento dei dipartimenti.'),
    });

    this.dipChangeSub?.unsubscribe();
    this.dipChangeSub = this.createForm.controls.dipartimentoId.valueChanges.subscribe((dipId) => {
      this.corsiList = [];
      this.selectedCorso = null;

      this.createForm.controls.corsoDiStudiId.reset(null, { emitEvent: false });
      this.createForm.controls.corsoDiStudiId.disable({ emitEvent: false });

      if (!dipId) return;

      this.corsiLoading = true;

      this.corsiLoadSub?.unsubscribe();
      this.corsiLoadSub = this.corsiSvc
        .getByDipartimento(dipId)
        .pipe(finalize(() => (this.corsiLoading = false)))
        .subscribe({
          next: (c) => {
            this.corsiList = c ?? [];
            this.syncSelectedCorso();

            if (this.corsiList.length > 0) {
              this.createForm.controls.corsoDiStudiId.enable({ emitEvent: false });
            }
          },
          error: () => (this.errorMsg = 'Errore durante il caricamento dei corsi di studio.'),
        });
    });

    this.corsoChangeSub?.unsubscribe();
    this.corsoChangeSub = this.createForm.controls.corsoDiStudiId.valueChanges.subscribe(() => {
      this.syncSelectedCorso();
    });

    this.staffChangeSub?.unsubscribe();
    this.staffChangeSub = this.createForm.controls.staff.valueChanges.subscribe(() => {});
  }

  closeModal(): void {
    this.modalOpen = false;

    this.dipLoadSub?.unsubscribe();
    this.corsiLoadSub?.unsubscribe();

    this.dipChangeSub?.unsubscribe();
    this.staffChangeSub?.unsubscribe();
    this.corsoChangeSub?.unsubscribe();

    this.corsiLoading = false;
    this.corsiList = [];
    this.selectedCorso = null;
  }

  saveCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const v = this.createForm.getRawValue();
    const ruoli: Ruolo[] = [Ruolo.USER, ...(v.staff ? [Ruolo.STAFF] : [])];

    const payload: PersonaRequestDTO = {
      nome: v.nome!,
      cognome: v.cognome!,
      email: v.email!,
      corsoDiStudiId: v.corsoDiStudiId!,
      annoCorso: v.annoCorso ?? null,
      staff: !!v.staff,
      ruoli,
    };

    this.saving = true;
    this.adminService
      .createPersona(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
        },
        error: () => (this.errorMsg = 'Errore durante la creazione della persona.'),
      });
  }

  private syncSelectedCorso(): void {
    const id = this.createForm.controls.corsoDiStudiId.value;
    this.selectedCorso = id ? this.corsiList.find((c) => c.id === id) ?? null : null;
  }

  openEdit(s: StaffCardDTO, me: CurrentUserLite, isDir: boolean): void {
    if (this.modalOpen) this.closeModal();

    this.editPersona = s;
    this.editMe = me;
    this.editIsDir = isDir;
    this.editOpen = true;
  }

  closeEdit(): void {
    this.editOpen = false;
    this.editPersona = null;
    this.editMe = null;
    this.editIsDir = false;
  }

  onEditSaved(): void {
    this.load();
    this.closeEdit();
  }

  delete(s: StaffCardDTO): void {
    console.log('DELETE', { id: this.getStaffId(s) });
  }

  back(): void {
    this.router.navigateByUrl('/');
  }

  // FOTO
  photoSrc(s: StaffCardDTO): string | null {
    const sid = this.getStaffId(s);
    if (sid != null && this.brokenPhotos.has(sid)) return null;
    return s.fotoThumbnailUrl || s.fotoUrl || null;
  }

  onImgError(s: StaffCardDTO): void {
    const sid = this.getStaffId(s);
    if (sid != null) this.brokenPhotos.add(sid);
  }

  openDeleteModal(s: StaffCardDTO, ev?: Event): void {
    ev?.stopPropagation();
    this.errorMsg = '';

    // solo direttivo vede già il bottone, ma ribadisco lato TS
    this.toDelete = s;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    // evita chiusure mentre sta eliminando
    this.deleteModalOpen = false;
    this.toDelete = null;
  }

  confirmDelete(): void {
    this.errorMsg = '';

    const s = this.toDelete;
    if (!s) return;

    const id = this.getStaffId(s);
    if (!id) {
      this.errorMsg = 'Impossibile eliminare: manca l’id della persona.';
      return;
    }

    this.deletingPersona = true;

    this.staffService.deletePersona(id)
      .pipe(finalize(() => (this.deletingPersona = false)))
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.load();

          // se per caso stavi editando proprio quella persona, chiudi la modale edit
          const editId = this.editPersona ? this.getStaffId(this.editPersona) : null;
          if (editId && editId === id) this.closeEdit();
        },
        error: (err) => {
          this.errorMsg = this.extractApiMessage(err, 'Eliminazione non riuscita.');
        },
      });
  }

// prende il messaggio del tuo handler BE
  private extractApiMessage(err: any, fallback: string): string {
    const e = err?.error;
    return (
      e?.message ||
      e?.error ||
      e?.detail ||
      err?.message ||
      fallback
    );
  }

}
