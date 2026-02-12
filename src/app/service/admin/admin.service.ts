import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiUrl } from '../../core/api-url';

import {PersonaRequestDTO, PersonaResponseDTO, Ruolo} from '../../model/persona.model';
import {
  DirettivoRequestDTO,
  DirettivoResponseDTO,
  PersonaDirettivoRequestDTO,
  PersonaDirettivoResponseDTO
} from '../../model/direttivo.model';

/** Lite per organi (lasciato come avevi) */
export interface OrganoRappresentanzaLiteDTO {
  id: number;
  nome: string;
}

/** DTO per organi di rappresentanza */
export interface PersonaRappresentanzaRequestDTO {
  personaId: number;
  organoRappresentanzaId: number;
  dataInizio?: string | null;
  dataFine?: string | null;
}

export interface PersonaMiniDTO {
  id: number;
  nome: string;
  cognome: string;
}


@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  // ---------------- PERSONA ----------------

  /** POST /{BASE}/admin/persona */
  createPersona(dto: PersonaRequestDTO): Observable<PersonaResponseDTO> {
    const url = apiUrl(environment.api.adminPath, environment.api.personaPath);
    return this.http.post<PersonaResponseDTO>(url, dto, { withCredentials: true });
  }

  // ---------------- DIRETTIVI (LISTA) ----------------

  /**
   * BE: GET /{BASE}/admin/direttivi
   * AdminController: @GetMapping("/" + ApiPath.DIRETTIVI_PATH)
   */
  getDirettivi(): Observable<DirettivoResponseDTO[]> {
    const direttiviPath = (environment.api as any).direttiviPath ?? 'direttivi';
    const url = apiUrl(environment.api.adminPath, direttiviPath);
    return this.http.get<DirettivoResponseDTO[]>(url, { withCredentials: true });
  }

  // ---------------- DIRETTIVO (CRUD) ----------------
  /**
   * BE: POST /{BASE}/admin/direttivo
   * AdminController: @PostMapping("/" + ApiPath.DIRETTIVO_PATH)
   */
  creaDirettivo(dto: DirettivoRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath);
    return this.http.post<void>(url, dto, { withCredentials: true });
  }

  /**
   * BE: PUT /{BASE}/admin/direttivo
   * AdminController: @PutMapping("/" + ApiPath.DIRETTIVO_PATH)
   */
  aggiornaDirettivo(dto: DirettivoRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath);
    return this.http.put<void>(url, dto, { withCredentials: true });
  }

  /**
   * BE: DELETE /{BASE}/admin/direttivo/{direttivoId}
   * AdminController: @DeleteMapping("/" + ApiPath.DIRETTIVO_PATH + "/{direttivoId}")
   */
  eliminaDirettivo(direttivoId: number): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath, direttivoId);
    return this.http.delete<void>(url, { withCredentials: true });
  }

  // ---------------- PERSONE NEL DIRETTIVO ----------------
  /**
   * BE: POST /{BASE}/admin/direttivo/persona
   */
  assegnaPersonaADirettivo(dto: PersonaDirettivoRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath, environment.api.personaPath);
    return this.http.post<void>(url, dto, { withCredentials: true });
  }

  /**
   * BE: PUT /{BASE}/admin/direttivo/persona
   */
  modificaPersonaADirettivo(dto: PersonaDirettivoRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.direttivoPath, environment.api.personaPath);
    return this.http.put<void>(url, dto, { withCredentials: true });
  }

  getPersoneByRuoloNonPresentiNelDirettivo(ruolo: Ruolo | string, direttivoId: number): Observable<PersonaMiniDTO[]> {
    const url = apiUrl(
      environment.api.adminPath,
      environment.api.direttivoPath,
      'ruolo',
      ruolo,
      'non-presenti-direttivo',
      direttivoId
    );

    return this.http.get<PersonaMiniDTO[]>(url, { withCredentials: true });
  }

  /**
   * BE: DELETE /{BASE}/admin/direttivo/persona/{personaId}/{direttivoId}
   */
  rimuoviPersonaDaDirettivo(personaId: number, direttivoId: number): Observable<void> {
    const url = apiUrl(
      environment.api.adminPath,
      environment.api.direttivoPath,
      environment.api.personaPath,
      personaId,
      direttivoId
    );
    return this.http.delete<void>(url, { withCredentials: true });
  }

  /**
   * PROPOSTA: GET /{BASE}/admin/direttivo/persona/{direttivoId}
   */
  getMembriDirettivo(direttivoId: number): Observable<PersonaDirettivoResponseDTO[]> {;
    const url = apiUrl(environment.api.publicPath, environment.api.direttivoPath, direttivoId, environment.api.personePath);
    return this.http.get<PersonaDirettivoResponseDTO[]>(url, { withCredentials: true });
  }


  // ---------------- ORGANI (come avevi) ----------------

  getOrganiAll(): Observable<OrganoRappresentanzaLiteDTO[]> {
    const organiPath = (environment.api as any).organiPath ?? 'organi';
    const url = apiUrl(environment.api.adminPath, organiPath);
    return this.http.get<OrganoRappresentanzaLiteDTO[]>(url, { withCredentials: true });
  }

  assegnaPersonaAOrgano(dto: PersonaRappresentanzaRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.rappresentantePath);
    return this.http.post<void>(url, dto, { withCredentials: true });
  }

  modificaPersonaAOrgano(dto: PersonaRappresentanzaRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.rappresentantePath);
    return this.http.put<void>(url, dto, { withCredentials: true });
  }

  eliminaPersonaRappresentanza(personaRappresentanzaId: number): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.rappresentantePath, personaRappresentanzaId);
    return this.http.delete<void>(url, { withCredentials: true });
  }
}
