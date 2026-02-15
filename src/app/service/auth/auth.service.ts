import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { LoginRequestDTO, LoginResponseDTO } from '../../model/auth.model';
import {PasswordSetRequest} from '../../model/password.model';
import { environment } from '../../environments/environment';
import { apiUrl } from '../../core/api-url';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'impronta_user';

  private _currentUser$ = new BehaviorSubject<LoginResponseDTO | null>(this.loadUser());
  readonly currentUser$ = this._currentUser$.asObservable();
  readonly isLoggedIn$ = this.currentUser$.pipe(map((u) => !!u));

  constructor(private http: HttpClient) {}

  login(dto: LoginRequestDTO): Observable<LoginResponseDTO> {
    // impronta/studentesca/official/api/auth/login
    const url = apiUrl(environment.api.authPath, 'login');

    return this.http
      .post<LoginResponseDTO>(url, dto, { withCredentials: true })
      .pipe(tap((user) => this.setCurrentUser(user)));
  }

  logout(): Observable<void> {
    const url = apiUrl(environment.api.authPath, 'logout');

    return this.http
      .post<void>(url, null, { withCredentials: true })
      .pipe(
        tap(() => this.clearLocalUser()),
        catchError(() => {
          // anche se il backend fallisce, chiudiamo UI localmente
          this.clearLocalUser();
          return of(void 0);
        })
      );
  }

  /**
   * POST /auth/persona/{personaId}/crea/password
   * Body: { password, token }
   */
  creaPassword(personaId: number, password: string, token: string): Observable<void> {
    const url = apiUrl(environment.api.authPath, 'persona', personaId, 'crea', 'password');
    const body: PasswordSetRequest = { password, token };
    return this.http.post<void>(url, body);
  }

  /**
   * POST /auth/persona/{personaId}/modifica/password
   * Body: { password, token }
   */
  modificaPassword(personaId: number, password: string, token: string): Observable<void> {
    const url = apiUrl(environment.api.authPath, 'persona', personaId, 'modifica', 'password');
    const body: PasswordSetRequest = { password, token };
    return this.http.post<void>(url, body);
  }


  /** Utente sync (utile in guard / sync checks) */
  getCurrentUser(): LoginResponseDTO | null {
    return this._currentUser$.value;
  }

  /** Permette di settare l'utente centralmente (login / me / refresh) */
  private setCurrentUser(user: LoginResponseDTO): void {
    this._currentUser$.next(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // --- helpers ---
  private loadUser(): LoginResponseDTO | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoginResponseDTO;
    } catch {
      return null;
    }
  }

  private clearLocalUser(): void {
    localStorage.removeItem(this.USER_KEY);
    this._currentUser$.next(null);
  }

  forceLogoutLocal(): void {
    localStorage.removeItem(this.USER_KEY);
    this._currentUser$.next(null);
  }

  hasStoredUser(): boolean {
    return !!localStorage.getItem(this.USER_KEY);
  }

  richiestaModificaPassword(email: string): Observable<void> {
    const safeEmail = encodeURIComponent(email.trim());
    const url = apiUrl(environment.api.authPath, 'richiesta', 'modifica', 'password', safeEmail);
    return this.http.get<void>(url, { withCredentials: true });
  }
}
