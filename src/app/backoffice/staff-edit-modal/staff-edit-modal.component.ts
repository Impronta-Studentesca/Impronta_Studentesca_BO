import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { StaffCardDTO } from '../../model/staff.model';
import { TipoCorso, CorsoDiStudiResponseDTO } from '../../model/corsi.model';
import { DipartimentiService, DipartimentoDTO } from '../../service/dipartimenti/dipartimenti.service';
import { CorsiService } from '../../service/corsi/corsi.service';
import { StaffService } from '../../service/staff/staff.service';
import { PersonaRequestDTO } from '../../model/persona.model';
import { TIPO_CORSO_LABEL } from '../../core/constants/tipo-corso-label';

import {
  AdminService,
  OrganoRappresentanzaLiteDTO,
  PersonaRappresentanzaRequestDTO,
} from '../../service/admin/admin.service';

// ✅ CROP
import { ImageCropperComponent, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';


type CurrentUserLite =
  | {
  id?: number | string;
  personaId?: number | string;
  userId?: number | string;
  utenteId?: number | string;
  email?: string;
  username?: string;
  persona?: { id?: number | string };
  user?: { id?: number | string };
}
  | null;

type TabKey = 'ANAG' | 'RAPP';

type PersonaRappView = {
  id: number | null;
  organoRappresentanzaId: number | null;
  organoNome: string;
  dataInizio: string | null;
  dataFine: string | null;
};

@Component({
  selector: 'app-staff-edit-modal',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, ReactiveFormsModule, ImageCropperComponent],
  templateUrl: './staff-edit-modal.component.html',
  styleUrl: './staff-edit-modal.component.scss',
})
export class StaffEditModalComponent implements OnInit, OnDestroy, OnChanges {
  private fb = inject(FormBuilder);
  private dipSvc = inject(DipartimentiService);
  private corsiSvc = inject(CorsiService);
  private staffSvc = inject(StaffService);
  private adminSvc = inject(AdminService);

  @Input({ required: true }) persona!: StaffCardDTO;
  @Input({ required: true }) me!: CurrentUserLite;
  @Input() isDir = false;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  tab: TabKey = 'ANAG';

  savingAnag = false;
  savingPhoto = false;
  errorMsg = '';

  dipList: DipartimentoDTO[] = [];
  corsiList: CorsoDiStudiResponseDTO[] = [];
  corsiLoading = false;

  selectedCorso: CorsoDiStudiResponseDTO | null = null;

  readonly TIPO_CORSO_LABEL = TIPO_CORSO_LABEL;
  protected readonly TipoCorso = TipoCorso;

  // ---------------- FOTO + CROP ----------------
  photoFile: File | null = null;

  /** evento file input per il cropper */
  imageChangedEvent: Event | null = null;

  /** blob finale croppato */
  croppedBlob: Blob | null = null;

  /** preview croppato (dataURL) */
  croppedPreviewUrl: string | null = null;

  /** zoom */
  zoom = 1;
  transform: ImageTransform = { scale: 1 };

  private dipSub?: Subscription;
  private corsoSub?: Subscription;
  private dipLoadSub?: Subscription;
  private corsiLoadSub?: Subscription;

  // RAPPRESENTANZE
  organiList: OrganoRappresentanzaLiteDTO[] = [];
  rappList: PersonaRappView[] = [];

  savingRapp = false;
  deletingRappId: number | null = null;
  editingRapp = false;

  private initialized = false;

  form = this.fb.group({
    id: [null as number | null, Validators.required],
    nome: ['', [Validators.required, Validators.minLength(2)]],
    cognome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],

    dipartimentoId: [null as number | null, Validators.required],
    corsoDiStudiId: [{ value: null as number | null, disabled: true }, Validators.required],

    annoCorso: [null as number | null],
    staff: [true],
  });

  rappForm = this.fb.group({
    personaRappresentanzaId: [null as number | null],
    organoRappresentanzaId: [null as number | null, Validators.required],
    dataInizio: [null as string | null],
    dataFine: [null as string | null],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['persona'] && this.persona) {
      this.patchFromPersona();
      this.rebuildRappFromPersona();
      this.resetRappForm(false);

      // reset crop
      this.resetCropState();

      if (this.initialized) {
        this.loadDipartimenti();
        if (this.isDir) this.loadOrganiList();
      }
    }
  }

  ngOnInit(): void {
    this.initialized = true;

    if (!this.form.controls.id.value && this.persona) {
      this.patchFromPersona();
    }

    this.loadDipartimenti();
    this.setupSubs();

    // sicurezza: se NON direttivo e non è la sua card -> chiudo
    if (!this.isDir && !this.isSelf()) {
      this.closed.emit();
      return;
    }

    if (!this.isDir) {
      this.form.disable({ emitEvent: false });
    } else {
      this.rebuildRappFromPersona();
      this.loadOrganiList();
    }
  }

  ngOnDestroy(): void {
    this.dipSub?.unsubscribe();
    this.corsoSub?.unsubscribe();
    this.dipLoadSub?.unsubscribe();
    this.corsiLoadSub?.unsubscribe();
  }

  // ---------------- UI ----------------
  setTab(t: TabKey): void {
    if (!this.isDir && t !== 'ANAG') return;
    this.tab = t;
  }

  close(): void {
    this.closed.emit();
  }

  // ---------------- PATCH INIT ----------------
  private initialSnapshot = '';

  private snapshot(): void {
    this.initialSnapshot = JSON.stringify(this.form.getRawValue());
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private getPersonaRoles(): string[] {
    const raw =
      (this.persona as any)?.ruoli ??
      (this.persona as any)?.roles ??
      (this.persona as any)?.authorities ??
      [];

    if (!Array.isArray(raw)) return [];

    return raw
      .map((r: any) => (typeof r === 'string' ? r : r?.nome ?? r?.name ?? r?.authority ?? ''))
      .filter(Boolean)
      .map((s: string) => s.trim().toUpperCase());
  }

  private personaHasRole(role: string): boolean {
    const target = role.toUpperCase();
    return this.getPersonaRoles().some((r) => r === target || r.endsWith(`_${target}`));
  }

  private patchFromPersona(): void {
    const id = Number((this.persona as any)?.id ?? (this.persona as any)?.personaId);
    const dipId = (this.persona as any)?.corsoDiStudi?.dipartimento?.id ?? null;
    const corsoId = (this.persona as any)?.corsoDiStudi?.id ?? null;

    const email = String((this.persona as any)?.mail ?? (this.persona as any)?.email ?? '');
    const staffFlag = this.personaHasRole('STAFF');

    this.form.patchValue(
      {
        id: Number.isFinite(id) ? id : null,
        nome: (this.persona as any)?.nome ?? '',
        cognome: (this.persona as any)?.cognome ?? '',
        email,
        dipartimentoId: dipId,
        corsoDiStudiId: corsoId,
        annoCorso: (this.persona as any)?.annoCorso ?? null,
        staff: staffFlag,
      },
      { emitEvent: false }
    );

    this.form.controls.corsoDiStudiId.disable({ emitEvent: false });
    this.snapshot();
  }

  private loadDipartimenti(): void {
    this.dipLoadSub?.unsubscribe();
    this.dipLoadSub = this.dipSvc.getAll().subscribe({
      next: (d) => (this.dipList = d ?? []),
      error: () => (this.errorMsg = 'Errore durante il caricamento dei dipartimenti.'),
    });

    const dipId = this.form.controls.dipartimentoId.value;
    if (dipId) this.loadCorsi(dipId, true);
  }

  private setupSubs(): void {
    this.dipSub?.unsubscribe();
    this.dipSub = this.form.controls.dipartimentoId.valueChanges.subscribe((dipId) => {
      this.corsiList = [];
      this.selectedCorso = null;

      this.form.controls.corsoDiStudiId.reset(null, { emitEvent: false });
      this.form.controls.corsoDiStudiId.disable({ emitEvent: false });

      if (!dipId) return;
      this.loadCorsi(dipId, false);
    });

    this.corsoSub?.unsubscribe();
    this.corsoSub = this.form.controls.corsoDiStudiId.valueChanges.subscribe(() => {
      this.syncSelectedCorso();
    });
  }

  private loadCorsi(dipId: number, keepSelection: boolean): void {
    this.corsiLoading = true;

    this.corsiLoadSub?.unsubscribe();
    this.corsiLoadSub = this.corsiSvc
      .getByDipartimento(dipId)
      .pipe(finalize(() => (this.corsiLoading = false)))
      .subscribe({
        next: (c) => {
          this.corsiList = c ?? [];
          if (this.corsiList.length > 0) this.form.controls.corsoDiStudiId.enable({ emitEvent: false });
          if (keepSelection) this.syncSelectedCorso();
        },
        error: () => (this.errorMsg = 'Errore durante il caricamento dei corsi di studio.'),
      });
  }

  private syncSelectedCorso(): void {
    const id = this.form.controls.corsoDiStudiId.value;
    this.selectedCorso = id ? this.corsiList.find((c) => c.id === id) ?? null : null;
  }

  // ---------------- PERMESSI ----------------
  private isSelf(): boolean {
    const uid = this.getUserId(this.me);
    const pid = this.getPersonaId(this.persona);
    return uid != null && pid != null && uid === pid;
  }

  private getUserId(u: CurrentUserLite): number | null {
    const raw = u?.id ?? u?.personaId ?? u?.userId ?? u?.utenteId ?? u?.persona?.id ?? u?.user?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private getPersonaId(p: StaffCardDTO): number | null {
    const raw = (p as any)?.id ?? (p as any)?.personaId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  // ---------------- FOTO (CROP) ----------------
  onPickPhoto(ev: Event): void {
    this.errorMsg = '';
    const file = (ev.target as HTMLInputElement)?.files?.[0] ?? null;
    if (!file) return;

    // (opzionale) blocco lato FE per dimensione
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      this.errorMsg = `Il file è troppo grande. Max ${MAX_MB}MB.`;
      (ev.target as HTMLInputElement).value = '';
      return;
    }

    this.photoFile = file;
    this.imageChangedEvent = ev;

    // reset stato crop precedente
    this.croppedBlob = null;
    this.croppedPreviewUrl = null;
    this.zoom = 1;
    this.transform = { scale: 1 };
  }

  onImageCropped(e: ImageCroppedEvent): void {
    // preferisci blob (più comodo per upload)
    if (e.blob) {
      this.croppedBlob = e.blob;
    }
    if (e.base64) {
      this.croppedPreviewUrl = e.base64;
    }
  }

  zoomChange(v: number): void {
    this.zoom = v;
    this.transform = { ...this.transform, scale: this.zoom };
  }

  resetCropState(): void {
    this.photoFile = null;
    this.imageChangedEvent = null;
    this.croppedBlob = null;
    this.croppedPreviewUrl = null;
    this.zoom = 1;
    this.transform = { scale: 1 };
  }

  private buildCroppedFile(): File | null {
    if (!this.photoFile) return null;

    // se non ho un blob croppato, torno l’originale
    if (!this.croppedBlob) return this.photoFile;

    const originalName = this.photoFile.name || 'photo.jpg';

    // forza estensione jpg se vuoi (qui tengo la stessa estensione se possibile)
    const type = this.croppedBlob.type || this.photoFile.type || 'image/jpeg';

    const fileName = originalName;
    return new File([this.croppedBlob], fileName, { type });
  }

  savePhoto(): void {
    this.errorMsg = '';

    const personaId = this.form.controls.id.value;
    if (!personaId) return;

    if (!this.isDir && !this.isSelf()) return;

    const fileToUpload = this.buildCroppedFile();
    if (!fileToUpload) return;

    this.savingPhoto = true;

    this.staffSvc
      .uploadPersonaPhoto(personaId, fileToUpload)
      .pipe(finalize(() => (this.savingPhoto = false)))
      .subscribe({
        next: () => {
          this.resetCropState();
          this.saved.emit();
        },
        error: () => (this.errorMsg = 'Errore durante l’upload della foto.'),
      });
  }

  // ---------------- RAPPRESENTANZE ----------------
  private loadOrganiList(): void {
    if (!this.isDir) return;
    this.adminSvc.getOrganiAll().subscribe({
      next: (x) => (this.organiList = x ?? []),
      error: () => (this.organiList = []),
    });
  }

  private normalizeDate(val: any): string | null {
    if (!val) return null;
    const s = String(val);
    return s.length >= 10 ? s.substring(0, 10) : null;
  }

  private rebuildRappFromPersona(): void {
    const rappRaw =
      (this.persona as any)?.rappresentanze ??
      (this.persona as any)?.rappresentanza ??
      (this.persona as any)?.organiRappresentanza ??
      [];

    if (!Array.isArray(rappRaw)) {
      this.rappList = [];
      return;
    }

    this.rappList = rappRaw
      .map((x: any) => {
        const id = Number(x?.id ?? x?.personaRappresentanzaId ?? x?.rappresentanteId ?? x?.rappresentanzaId);

        const organoObj = x?.organoRappresentanza ?? x?.organo ?? null;
        const organoId = Number(x?.organoRappresentanzaId ?? organoObj?.id);

        const organoNome = String(x?.organoNome ?? organoObj?.nome ?? organoObj?.denominazione ?? '').trim();

        return {
          id: Number.isFinite(id) ? id : null,
          organoRappresentanzaId: Number.isFinite(organoId) ? organoId : null,
          organoNome,
          dataInizio: this.normalizeDate(x?.dataInizio ?? x?.inizio ?? x?.dal),
          dataFine: this.normalizeDate(x?.dataFine ?? x?.fine ?? x?.al),
        } as PersonaRappView;
      })
      .filter((r: PersonaRappView) => !!r.organoRappresentanzaId);
  }

  editRapp(r: PersonaRappView): void {
    if (!this.isDir) return;

    this.editingRapp = true;
    this.rappForm.patchValue(
      {
        personaRappresentanzaId: r.id,
        organoRappresentanzaId: r.organoRappresentanzaId,
        dataInizio: r.dataInizio,
        dataFine: r.dataFine,
      },
      { emitEvent: false }
    );

    // in modifica l’organo resta fisso
    this.rappForm.controls.organoRappresentanzaId.disable({ emitEvent: false });
  }

  resetRappForm(markTouched = true): void {
    this.editingRapp = false;

    this.rappForm.reset(
      {
        personaRappresentanzaId: null,
        organoRappresentanzaId: null,
        dataInizio: null,
        dataFine: null,
      },
      { emitEvent: false }
    );

    this.rappForm.controls.organoRappresentanzaId.enable({ emitEvent: false });

    if (markTouched) {
      this.rappForm.markAsPristine();
      this.rappForm.markAsUntouched();
    }
  }

  saveRapp(): void {
    this.errorMsg = '';
    if (!this.isDir) return;

    if (this.rappForm.invalid) {
      this.rappForm.markAllAsTouched();
      return;
    }

    const personaId = this.form.controls.id.value;
    if (!personaId) return;

    const v = this.rappForm.getRawValue();
    const organoId = Number(v.organoRappresentanzaId);

    if (!Number.isFinite(organoId) || organoId <= 0) {
      this.errorMsg = 'Seleziona un organo valido.';
      return;
    }

    if (v.dataInizio && v.dataFine && v.dataFine < v.dataInizio) {
      this.errorMsg = 'La data fine non può essere precedente alla data inizio.';
      return;
    }

    const dto: PersonaRappresentanzaRequestDTO = {
      personaId,
      organoRappresentanzaId: organoId,
      dataInizio: v.dataInizio ?? null,
      dataFine: v.dataFine ?? null,
    };

    this.savingRapp = true;

    const call$ = this.editingRapp
      ? this.adminSvc.modificaPersonaAOrgano(dto)
      : this.adminSvc.assegnaPersonaAOrgano(dto);

    call$
      .pipe(finalize(() => (this.savingRapp = false)))
      .subscribe({
        next: () => {
          const organoNome =
            this.organiList.find((o) => o.id === organoId)?.nome ??
            this.rappList.find((x) => x.organoRappresentanzaId === organoId)?.organoNome ??
            '';

          const idFromForm = v.personaRappresentanzaId ?? null;

          let existingIdx = -1;
          if (this.editingRapp && idFromForm != null) {
            existingIdx = this.rappList.findIndex((x) => x.id === idFromForm);
          }
          if (existingIdx < 0) {
            existingIdx = this.rappList.findIndex((x) => x.organoRappresentanzaId === organoId);
          }

          const nextRow: PersonaRappView = {
            id: idFromForm ?? this.rappList[existingIdx]?.id ?? null,
            organoRappresentanzaId: organoId,
            organoNome,
            dataInizio: dto.dataInizio ?? null,
            dataFine: dto.dataFine ?? null,
          };

          if (existingIdx >= 0) this.rappList.splice(existingIdx, 1, nextRow);
          else this.rappList = [nextRow, ...this.rappList];

          this.resetRappForm();
          this.saved.emit();
        },
        error: () => (this.errorMsg = 'Errore durante il salvataggio della rappresentanza.'),
      });
  }

  deleteRapp(r: PersonaRappView): void {
    this.errorMsg = '';
    if (!this.isDir) return;

    if (!r.id) {
      this.errorMsg = 'Impossibile eliminare: manca l’id della rappresentanza.';
      return;
    }

    this.deletingRappId = r.id;

    this.adminSvc
      .eliminaPersonaRappresentanza(r.id)
      .pipe(finalize(() => (this.deletingRappId = null)))
      .subscribe({
        next: () => {
          this.rappList = this.rappList.filter((x) => x.id !== r.id);
          this.resetRappForm();
          this.saved.emit();
        },
        error: () => (this.errorMsg = 'Errore durante la rimozione della rappresentanza.'),
      });
  }

  // trackBy
  trackByLite(_: number, x: { id: number }): number {
    return x.id;
  }

  trackByRapp(_: number, r: PersonaRappView): string {
    return `${r.organoRappresentanzaId ?? 'x'}-${r.id ?? 'n'}`;
  }

  // ---------------- ANAGRAFICA (solo direttivo) ----------------
  saveAnagrafica(): void {
    this.errorMsg = '';

    if (!this.isDir) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const dto: PersonaRequestDTO = {
      id: v.id!,
      nome: v.nome!,
      cognome: v.cognome!,
      email: v.email!,
      corsoDiStudiId: v.corsoDiStudiId!,
      annoCorso: v.annoCorso ?? null,
      staff: !!v.staff,

      // se il tuo DTO lo prevede ma non lo usi, lo mando vuoto
      ruoli: [],
    } as any;

    this.savingAnag = true;

    this.staffSvc
      .updatePersonaAnagrafica(dto)
      .pipe(finalize(() => (this.savingAnag = false)))
      .subscribe({
        next: () => {
          // aggiorno snapshot “iniziale” così non ti resta sporco il form
          this.snapshot();
          this.saved.emit();
        },
        error: () => (this.errorMsg = 'Errore durante il salvataggio anagrafica.'),
      });
  }


}
