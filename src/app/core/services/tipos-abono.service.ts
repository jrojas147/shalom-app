import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { TipoAbono, TipoAbonoRequest } from '../models/tipo-abono.model';

@Injectable({ providedIn: 'root' })
export class TiposAbonoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/tipos-abono`;

  getAll(soloActivos = false): Observable<TipoAbono[]> {
    const params = new HttpParams().set('soloActivos', String(soloActivos));
    return this.http.get<TipoAbono[]>(this.baseUrl, { params });
  }

  create(request: TipoAbonoRequest): Observable<TipoAbono> {
    return this.http.post<TipoAbono>(this.baseUrl, request);
  }

  update(id: number, request: TipoAbonoRequest): Observable<TipoAbono> {
    return this.http.put<TipoAbono>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
