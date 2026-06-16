import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { API_AUTH_URL } from '../config/api.config';
import { LoginRequest, LoginResponse, RefreshRequest, User } from '../models/user.model';

const TOKEN_KEY = 'shofi_token';
const REFRESH_KEY = 'shofi_refresh';
const USER_KEY = 'shofi_user';
const COMERCIO_KEY = 'shofi_comercio';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<User | null>(this.loadUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.getToken() && !!this.currentUserSignal());

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_AUTH_URL}/api/auth/login`, request)
      .pipe(tap((response) => this.persistSession(response)));
  }

  closeActiveSession(username: string, password: string): Observable<void> {
    return this.http.post<void>(`${API_AUTH_URL}/api/auth/close-session`, { username, password });
  }

  refresh(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const body: RefreshRequest = { refreshToken: refreshToken ?? '' };
    return this.http
      .post<LoginResponse>(`${API_AUTH_URL}/api/auth/refresh`, body)
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): Observable<void> {
    const request$ = this.getToken()
      ? this.http.post<void>(`${API_AUTH_URL}/api/auth/logout`, null)
      : of(void 0);

    return request$.pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.clearSession();
        void this.router.navigate(['/login']);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUserSignal();
    return !!user && roles.includes(user.rol);
  }

  /** Comercio efectivo: del usuario o, para DIRECCION, el seleccionado (default demo = 1). */
  getEffectiveComercioId(): number | null {
    const user = this.currentUserSignal();
    if (!user) {
      return null;
    }
    if (user.comercioId != null) {
      return user.comercioId;
    }
    if (user.rol === 'DIRECCION') {
      const stored = localStorage.getItem(COMERCIO_KEY);
      return stored ? Number(stored) : 1;
    }
    return null;
  }

  setSelectedComercioId(comercioId: number): void {
    localStorage.setItem(COMERCIO_KEY, String(comercioId));
  }

  forceLogout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
