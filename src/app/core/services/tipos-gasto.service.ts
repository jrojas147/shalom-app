import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { TipoGasto, TipoGastoRequest } from '../models/tipo-gasto.model';

@Injectable({ providedIn: 'root' })
export class TiposGastoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/tipos-gasto`;

  getAll(soloActivos = false): Observable<TipoGasto[]> {
    const params = new HttpParams().set('soloActivos', String(soloActivos));
    return this.http.get<TipoGasto[]>(this.baseUrl, { params });
  }

  create(request: TipoGastoRequest): Observable<TipoGasto> {
    return this.http.post<TipoGasto>(this.baseUrl, request);
  }

  update(id: number, request: TipoGastoRequest): Observable<TipoGasto> {
    return this.http.put<TipoGasto>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
