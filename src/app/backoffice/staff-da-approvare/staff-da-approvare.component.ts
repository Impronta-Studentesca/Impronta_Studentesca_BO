import {Component, inject, OnInit} from '@angular/core';
import {StaffService} from "../../service/staff/staff.service";
import {StaffCardDTO} from "../../model/staff.model";
import {AsyncPipe,NgForOf, NgIf} from "@angular/common";
import {AuthService} from "../../service/auth/auth.service";
import {map} from "rxjs";
import {PersonaRequestDTO} from "../../model/persona.model";
import {AdminService} from "../../service/admin/admin.service";

@Component({
  selector: 'app-staff-da-approvare',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    AsyncPipe
  ],
  templateUrl: './staff-da-approvare.component.html',
  styleUrl: './staff-da-approvare.component.scss'
})
export class StaffDaApprovareComponent implements OnInit {
  loading = false;
  errorMsg = '';
  successMsg = '';
  actionLoading = false;

  persone: StaffCardDTO[] = [];

  private staffService = inject(StaffService);
  private adminService = inject(AdminService);
  protected auth = inject(AuthService);

  // ✅ solo DIRETTIVO vede i comandi admin
  isDirettivo$ = this.auth.currentUser$.pipe(
    map(u => {
      const ruoli = (u?.ruoli ?? []) as any;
      const arr = Array.isArray(ruoli) ? ruoli : Array.from(ruoli ?? []);
      return arr.includes('DIRETTIVO');
    })
  );

  ngOnInit(): void {
    this.loadPersoneDaApprovare();
  }

  loadPersoneDaApprovare(): void {
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.staffService.getDaApprovare().subscribe({
      next: (res) => {
        this.persone = res ?? [];
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Errore durante il caricamento delle persone da approvare.';
        this.loading = false;
      }
    });
  }

  approvaSingolo(persona: StaffCardDTO): void {
    const payload = this.toPersonaRequestDTO(persona);
    if (!payload) return;

    this.actionLoading = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.adminService.approvaPersona(payload).subscribe({
      next: () => {
        this.persone = this.persone.filter(p => p.id !== persona.id);
        this.successMsg = `Persona ${persona.nome} ${persona.cognome} approvata correttamente.`;
        this.actionLoading = false;
      },
      error: () => {
        this.errorMsg = `Errore durante l'approvazione di ${persona.nome} ${persona.cognome}.`;
        this.actionLoading = false;
      }
    });
  }

  approvaTutti(): void {
    const payload = this.persone
      .map(p => this.toPersonaRequestDTO(p))
      .filter((p): p is PersonaRequestDTO => !!p);

    if (!payload.length) {
      return;
    }

    this.actionLoading = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.adminService.approvaTutti(payload).subscribe({
      next: () => {
        this.persone = [];
        this.successMsg = 'Tutte le persone sono state approvate correttamente.';
        this.actionLoading = false;
      },
      error: () => {
        this.errorMsg = 'Errore durante l’approvazione massiva.';
        this.actionLoading = false;
      }
    });
  }

  private toPersonaRequestDTO(persona: StaffCardDTO): PersonaRequestDTO | null {
    if (persona?.id == null) {
      return null;
    }

    return {
      id: persona.id,
      nome: persona.nome ?? '',
      cognome: persona.cognome ?? '',
      matricola: persona.matricola?? '',
      numeroTelefono: persona.numeroTelefono ?? '',
      email: persona.email ?? '',
      mailUnipa: persona.mailUnipa ?? '',
      corsoDiStudiId: persona.corsoDiStudi?.id ?? null,
      annoCorso: persona.annoCorso ?? null
    } as PersonaRequestDTO;
  }
}
