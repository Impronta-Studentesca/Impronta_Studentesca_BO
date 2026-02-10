// src/app/service/admin/admin-persone.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiUrl } from '../../core/api-url';

import { PersonaRequestDTO, PersonaResponseDTO } from '../../model/persona.model';

/** DTO per direttivo */
export interface PersonaDirettivoRequestDTO {
  personaId: number;
  direttivoId: number;
  ruoloNelDirettivo: string; // se hai enum, sostituisci con il tipo giusto
}

/** DTO per organi di rappresentanza */
export interface PersonaRappresentanzaRequestDTO {
  personaId: number;
  organoRappresentanzaId: number;
  dataInizio?: string | null; // 'YYYY-MM-DD'
  dataFine?: string | null;   // 'YYYY-MM-DD'
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  /** POST /{BASE}/admin/persona */
  createPersona(dto: PersonaRequestDTO): Observable<PersonaResponseDTO> {
    const url = apiUrl(environment.api.adminPath, environment.api.personaPath);
    return this.http.post<PersonaResponseDTO>(url, dto, { withCredentials: true });
  }

  // ---------------- DIRETTIVO ----------------

  /** POST /{BASE}/admin/direttivo */
  assegnaPersonaADirettivo(dto: PersonaDirettivoRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath);
    return this.http.post<void>(url, dto, { withCredentials: true });
  }

  /** PUT /{BASE}/admin/direttivo */
  modificaPersonaADirettivo(dto: PersonaDirettivoRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath);
    return this.http.put<void>(url, dto, { withCredentials: true });
  }

  /**
   * DELETE /{BASE}/admin/direttivo/{personaId}/{direttivoId}
   * (richiede backend con PathVariable nella path)
   */
  rimuoviPersonaDaDirettivo(personaId: number, direttivoId: number): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath, personaId, direttivoId);
    return this.http.delete<void>(url, { withCredentials: true });
  }

  // ---------------- ORGANI DI RAPPRESENTANZA ----------------

  /** POST /{BASE}/admin/rappresentante */
  assegnaPersonaAOrgano(dto: PersonaRappresentanzaRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.rappresentantePath);
    return this.http.post<void>(url, dto, { withCredentials: true });
  }

  /** PUT /{BASE}/admin/rappresentante */
  modificaPersonaAOrgano(dto: PersonaRappresentanzaRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.rappresentantePath);
    return this.http.put<void>(url, dto, { withCredentials: true });
  }

  /** DELETE /{BASE}/admin/rappresentante/{personaRappresentanzaId} */
  eliminaPersonaRappresentanza(personaRappresentanzaId: number): Observable<void> {
    const url = apiUrl(
      environment.api.adminPath,
      environment.api.rappresentantePath,
      personaRappresentanzaId
    );
    return this.http.delete<void>(url, { withCredentials: true });
  }
}
