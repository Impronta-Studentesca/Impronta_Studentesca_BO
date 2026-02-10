import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiUrl } from '../../core/api-url';

export interface DipartimentoDTO {
  id: number;
  nome: string;
  codice: string;
}

export interface DipartimentoRequestDTO {
  id?: number;
  nome: string;
  codice: string;
}

@Injectable({ providedIn: 'root' })
export class DipartimentiService {
  constructor(private http: HttpClient) {}

  /** GET /{BASE}/public/dipartimenti/all */
  getAll(): Observable<DipartimentoDTO[]> {
    const url = apiUrl(
      environment.api.publicPath,
      environment.api.dipartimentiPath,
      environment.api.allPath
    );
    return this.http.get<DipartimentoDTO[]>(url, { withCredentials: true });
  }

  /** POST /{BASE}/admin/dipartimento */
  create(dto: DipartimentoRequestDTO): Observable<DipartimentoDTO> {
    const url = apiUrl(environment.api.adminPath, environment.api.dipartimentoPath);
    return this.http.post<DipartimentoDTO>(url, dto, { withCredentials: true });
  }

  /** PUT /{BASE}/admin/dipartimento */
  update(dto: DipartimentoRequestDTO): Observable<DipartimentoDTO> {
    const url = apiUrl(environment.api.adminPath, environment.api.dipartimentoPath);
    return this.http.put<DipartimentoDTO>(url, dto, { withCredentials: true });
  }

  /** DELETE /{BASE}/admin/dipartimento (body) */
  delete(dto: DipartimentoRequestDTO): Observable<void> {
    const url = apiUrl(environment.api.adminPath, environment.api.dipartimentoPath);
    return this.http.request<void>('DELETE', url, {
      body: dto,
      withCredentials: true,
    });
  }
}
