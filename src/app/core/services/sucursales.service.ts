import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { Sucursal, SucursalRequest } from '../models/sucursal.model';

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/sucursales`;

  getAll(soloActivas = false): Observable<Sucursal[]> {
    const params = soloActivas ? new HttpParams().set('soloActivas', 'true') : undefined;
    return this.http.get<Sucursal[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.baseUrl}/${id}`);
  }

  create(request: SucursalRequest): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.baseUrl, request);
  }

  update(id: number, request: SucursalRequest): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
