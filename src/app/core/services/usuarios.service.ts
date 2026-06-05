import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_AUTH_URL } from '../config/api.config';
import { Page, User, UsuarioRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_AUTH_URL}/api/usuarios`;

  getPage(page = 0, size = 20): Observable<Page<User>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<User>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(request: UsuarioRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  update(id: number, request: UsuarioRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  checkUsername(username: string, excludeId?: number): Observable<{ available: boolean }> {
    let params = new HttpParams().set('username', username);
    if (excludeId != null) {
      params = params.set('excludeId', excludeId);
    }
    return this.http.get<{ available: boolean }>(`${this.baseUrl}/check-username`, { params });
  }
}
