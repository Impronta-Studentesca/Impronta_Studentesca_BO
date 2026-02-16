// src/app/service/staff/staff.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StaffCardDTO } from '../../model/staff.model';
import { environment } from '../../environments/environment';
import { apiUrl } from '../../core/api-url';
import {PersonaRequestDTO, PersonaResponseDTO} from "../../model/persona.model";

// <- usa il TUO helper (come in AuthService)

@Injectable({ providedIn: 'root' })
export class StaffService {
  constructor(private http: HttpClient) {}

  getStaff(): Observable<StaffCardDTO[]> {
    const url = apiUrl(environment.api.staffPath, 'all'); // es. '/staff'
    return this.http.get<StaffCardDTO[]>(url);
  }

  /** ANAGRAFICA: PUT /admin/persona */
  updatePersonaAnagrafica(payload: PersonaRequestDTO): Observable<PersonaResponseDTO> {
    const url = apiUrl(environment.api.staffPath, 'persona'); // es. /admin/persona
    return this.http.put<PersonaResponseDTO>(url, payload);
  }

  /** ANAGRAFICA: DELETE /admin/persona/{personaId} */
  deletePersona(personaId: number): Observable<void> {
    const url = apiUrl(environment.api.staffPath, 'persona', personaId); // es. /admin/persona/123
    return this.http.delete<void>(url);
  }

  /** POST /staff/persona/{id}/photo (upload foto) */
  uploadPersonaPhoto(personaId: number, file: File): Observable<void> {
    const url = apiUrl(environment.api.staffPath, `persona/${personaId}/foto`);
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<void>(url, fd);
  }

  deleteFotoPersona(personaId: number) {
    const url = apiUrl(environment.api.staffPath, environment.api.personaPath, personaId, 'foto');
    return this.http.delete<void>(url);
  }

}
