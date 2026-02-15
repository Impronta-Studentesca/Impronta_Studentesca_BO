import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, map } from 'rxjs';

import { AdminService, PersonaMiniDTO } from '../../service/admin/admin.service';
import {
  DirettivoResponseDTO,
  PersonaDirettivoRequestDTO,
  PersonaDirettivoResponseDTO,
  RUOLI_DIRETTIVO,
  RuoloDirettivoCode,
  RUOLO_DIRETTIVO_LABEL_BY_CODE,
} from '../../model/direttivo.model';
import {extractApiErrorMessage} from "../../core/http-error";
import {AuthService} from "../../service/auth/auth.service";

@Component({
  selector: 'app-membri-direttivo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './membri-direttivo.component.html',
  styleUrl: './membri-direttivo.component.scss',
})
export class MembriDirettivoComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private admin = inject(AdminService);
  private fb = inject(FormBuilder);

  direttivoId!: number;
  direttivo?: DirettivoResponseDTO;

  membri: PersonaDirettivoResponseDTO[] = [];
  loading = false;
  errorMsg: string | null = null;

  // --- ADD PERSONA MODAL ---
  addModalOpen = false;
  personeDisponibili: PersonaMiniDTO[] = [];
  loadingPersone = false;

  isDirettivo$ = this.auth.currentUser$.pipe(
    map(u => {
      const ruoli = (u?.ruoli ?? []) as any;
      const arr = Array.isArray(ruoli) ? ruoli : Array.from(ruoli ?? []);
      return arr.includes('DIRETTIVO');
    })
  );

  ruoloDirettivoOptions = RUOLI_DIRETTIVO;
  private roleCodeSet = new Set<RuoloDirettivoCode>(RUOLI_DIRETTIVO.map(r => r.code));

  addForm = this.fb.group({
    personaId: [null as number | null, [Validators.required]],
    ruoloDirettivo: ['SOCIO_CONSIGLIERE' as RuoloDirettivoCode, [Validators.required]],
  });

  // --- REMOVE MODAL ---
  removeModalOpen = false;
  toRemove?: PersonaDirettivoResponseDTO;

  // --- CHANGE ROLE MODAL ---
  roleModalOpen = false;
  toEditRole?: PersonaDirettivoResponseDTO;

  editRoleForm = this.fb.group({
    ruoloDirettivo: ['SOCIO_CONSIGLIERE' as RuoloDirettivoCode, [Validators.required]],
  });

  // --- Label tipo direttivo in testata ---
  private readonly TIPO_DIRETTIVO_LABEL: Record<string, string> = {
    GENERALE: 'Direttivo generale',
    DIPARTIMENTALE: 'Direttivo dipartimentale',
  };

  tipoLabel(tipo?: any): string {
    if (!tipo) return 'Direttivo';
    return this.TIPO_DIRETTIVO_LABEL[String(tipo)] ?? String(tipo);
  }

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state as any) ?? this.location.getState();

    this.route.paramMap
      .pipe(map(pm => Number(pm.get('direttivoId'))))
      .subscribe((id) => {
        this.direttivoId = id;

        const d = state?.direttivo as DirettivoResponseDTO | undefined;
        if (d && d.id === id) this.direttivo = d;

        this.loadMembri();
      });
  }

  back(): void {
    this.router.navigate(['/backoffice/direttivi']);
  }

  // ----------------- LOAD MEMBRI -----------------

  loadMembri(): void {
    this.loading = true;
    this.errorMsg = null;

    this.admin.getMembriDirettivo(this.direttivoId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.membri = data ?? []),
        error: (err) => {
          this.membri = [];
          this.errorMsg = extractApiErrorMessage(err, 'Recupero non riuscito.');
        },
      });
  }

  // ----------------- RUOLI (display + normalize) -----------------

  /**
   * Normalizza in code (RuoloDirettivoCode) anche se dal BE arriva:
   * - code: "SOCIO_CONSIGLIERE"
   * - label: "Socio Consigliere"
   * - label con spazi/maiuscole strane
   */
  private normalizeRoleCode(value: string): RuoloDirettivoCode | null {
    const v = (value ?? '').trim();
    if (!v) return null;

    // già code
    if (this.roleCodeSet.has(v as any)) return v as RuoloDirettivoCode;

    // match label
    const lower = v.replace(/\s+/g, ' ').toLowerCase();
    const found = RUOLI_DIRETTIVO.find(r => r.label.replace(/\s+/g, ' ').toLowerCase() === lower);
    return (found?.code ?? null) as any;
  }

  displayRoleLabel(value: string): string {
    const v = (value ?? '').trim();
    if (!v) return '-';

    // se arriva code → converti in label
    if (this.roleCodeSet.has(v as any)) {
      return RUOLO_DIRETTIVO_LABEL_BY_CODE[v as RuoloDirettivoCode] ?? v;
    }

    // se arriva label → prova a normalizzare e restituisci la label “ufficiale”
    const code = this.normalizeRoleCode(v);
    if (code) return RUOLO_DIRETTIVO_LABEL_BY_CODE[code];

    // fallback: stampa quello che arriva
    return v;
  }

  // ----------------- CHANGE ROLE MODAL -----------------

  openRoleModal(m: PersonaDirettivoResponseDTO): void {
    this.toEditRole = m;
    this.roleModalOpen = true;

    const currentCode =
      this.normalizeRoleCode(m.ruoloNelDirettivo) ?? ('SOCIO_CONSIGLIERE' as RuoloDirettivoCode);

    this.editRoleForm.setValue({ ruoloDirettivo: currentCode });
  }

  closeRoleModal(): void {
    this.roleModalOpen = false;
    this.toEditRole = undefined;
  }

  confirmRoleChange(): void {
    if (!this.toEditRole) return;
    if (this.editRoleForm.invalid) {
      this.editRoleForm.markAllAsTouched();
      return;
    }

    const code = this.editRoleForm.get('ruoloDirettivo')!.value as RuoloDirettivoCode;
    const ruoloNelDirettivo = RUOLO_DIRETTIVO_LABEL_BY_CODE[code];

    const payload: PersonaDirettivoRequestDTO = {
      personaId: this.toEditRole.personaResponseDTO.id,
      direttivoId: this.toEditRole.direttivoId ?? this.direttivoId,
      ruoloNelDirettivo,
    };

    this.loading = true;
    this.errorMsg = null;

    this.admin.modificaPersonaADirettivo(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          // aggiorno la UI senza reload totale (più fluido)
          this.toEditRole!.ruoloNelDirettivo = ruoloNelDirettivo;
          this.closeRoleModal();
        },
        error: (err) => (this.errorMsg = extractApiErrorMessage(err, 'Modifica non riuscita.')),
      });
  }

  // ----------------- ADD PERSONA MODAL (solo STAFF) -----------------

  openAddModal(): void {
    this.addModalOpen = true;
    this.errorMsg = null;

    this.addForm.reset({
      personaId: null,
      ruoloDirettivo: 'SOCIO_CONSIGLIERE' as RuoloDirettivoCode,
    });

    this.loadPersoneDisponibili();
  }

  closeAddModal(): void {
    this.addModalOpen = false;
  }

  loadPersoneDisponibili(): void {
    this.loadingPersone = true;

    this.admin.getPersoneByRuoloNonPresentiNelDirettivo('STAFF', this.direttivoId)
      .pipe(finalize(() => (this.loadingPersone = false)))
      .subscribe({
        next: (data) => (this.personeDisponibili = data ?? []),
        error: (err) => {
          this.personeDisponibili = [];
          this.errorMsg = extractApiErrorMessage(err, 'Recupero non riuscito');
          },
      });
  }

  addPersona(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    const personaId = Number(this.addForm.get('personaId')!.value);
    const ruoloCode = this.addForm.get('ruoloDirettivo')!.value as RuoloDirettivoCode;
    const ruoloNelDirettivo = RUOLO_DIRETTIVO_LABEL_BY_CODE[ruoloCode];

    const payload: PersonaDirettivoRequestDTO = {
      personaId,
      direttivoId: this.direttivoId,
      ruoloNelDirettivo,
    };

    this.loading = true;
    this.errorMsg = null;

    this.admin.assegnaPersonaADirettivo(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeAddModal();
          this.loadMembri();
        },
        error: (err) => (this.errorMsg = extractApiErrorMessage(err, 'Assegnazione non riuscita.')),
      });
  }

  // ----------------- REMOVE MODAL -----------------

  openRemoveModal(m: PersonaDirettivoResponseDTO): void {
    this.toRemove = m;
    this.removeModalOpen = true;
  }

  closeRemoveModal(): void {
    this.removeModalOpen = false;
    this.toRemove = undefined;
  }

  confirmRemove(): void {
    if (!this.toRemove) return;

    const personaId = this.toRemove.personaResponseDTO.id;
    const direttivoId = this.toRemove.direttivoId ?? this.direttivoId;

    this.loading = true;
    this.errorMsg = null;

    this.admin.rimuoviPersonaDaDirettivo(personaId, direttivoId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.closeRemoveModal();
          this.loadMembri();
          if (this.addModalOpen) this.loadPersoneDisponibili();
        },
        error: (err) => {
          this.closeRemoveModal()
          this.errorMsg = extractApiErrorMessage(err, 'Rimozione non riuscita.')},
      });
  }

  // ESC chiude modali (priorità: role > remove > add)
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.roleModalOpen) this.closeRoleModal();
    else if (this.removeModalOpen) this.closeRemoveModal();
    else if (this.addModalOpen) this.closeAddModal();
  }

  trackByPersonaId(_: number, m: PersonaDirettivoResponseDTO) {
    return m.personaResponseDTO.id;
  }
}
