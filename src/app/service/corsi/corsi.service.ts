import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiUrl } from '../../core/api-url';
import {
  CorsoDiStudiRequestDTO,
  CorsoDiStudiResponseDTO
} from '../../model/corsi.model';

@Injectable({ providedIn: 'root' })
export class CorsiService {
  constructor(private http: HttpClient) {}

  // ---------- PUBLIC ----------

  /** GET /public/dipartimento/{dipartimentoId}/corsi */
  getByDipartimento(dipartimentoId: number): Observable<CorsoDiStudiResponseDTO[]> {
    const url = apiUrl(
      environment.api.publicPath,
      environment.api.dipartimentoPath,
      String(dipartimentoId),
      environment.api.corsiPath
    );
    return this.http.get<CorsoDiStudiResponseDTO[]>(url, { withCredentials: true });
  }

  /** GET /public/corso/{corsoId} */
  getById(corsoId: number): Observable<CorsoDiStudiResponseDTO> {
    const url = apiUrl(
      environment.api.publicPath,
      environment.api.corsoPath,
      String(corsoId)
    );
    return this.http.get<CorsoDiStudiResponseDTO>(url, { withCredentials: true });
  }

  /** GET /public/persona/{personaId}/corso */
  getByPersona(personaId: number): Observable<CorsoDiStudiResponseDTO> {
    const url = apiUrl(
      environment.api.publicPath,
      environment.api.personaPath,
      String(personaId),
      environment.api.corsoPath
    );
    return this.http.get<CorsoDiStudiResponseDTO>(url, { withCredentials: true });
  }

  // ---------- ADMIN ----------

  /** POST /admin/corso */
  create(dto: CorsoDiStudiRequestDTO): Observable<CorsoDiStudiResponseDTO> {
    const url = apiUrl(environment.api.adminPath, environment.api.corsoPath);
    return this.http.post<CorsoDiStudiResponseDTO>(url, dto, { withCredentials: true });
  }

  /** PUT /admin/corso */
  update(dto: CorsoDiStudiRequestDTO): Observable<CorsoDiStudiResponseDTO> {
    const url = apiUrl(environment.api.adminPath, environment.api.corsoPath);
    return this.http.put<CorsoDiStudiResponseDTO>(url, dto, { withCredentials: true });
  }

  /** DELETE /admin/corso (body) */
  delete(dto: CorsoDiStudiRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.corsoPath);
    return this.http.request<void>('DELETE', url, {
      body: dto,
      withCredentials: true,
    });
  }
}
