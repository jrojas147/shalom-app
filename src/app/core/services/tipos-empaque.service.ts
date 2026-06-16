import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { TipoEmpaque, TipoEmpaqueRequest } from '../models/tipo-empaque.model';

@Injectable({ providedIn: 'root' })
export class TiposEmpaqueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/tipos-empaque`;

  getAll(): Observable<TipoEmpaque[]> {
    return this.http.get<TipoEmpaque[]>(this.baseUrl);
  }

  getById(id: number): Observable<TipoEmpaque> {
    return this.http.get<TipoEmpaque>(`${this.baseUrl}/${id}`);
  }

  create(request: TipoEmpaqueRequest): Observable<TipoEmpaque> {
    return this.http.post<TipoEmpaque>(this.baseUrl, request);
  }

  update(id: number, request: TipoEmpaqueRequest): Observable<TipoEmpaque> {
    return this.http.put<TipoEmpaque>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
