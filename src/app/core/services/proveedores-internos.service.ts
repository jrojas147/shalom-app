import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  ProveedorInterno,
  ProveedorInternoHijo,
  ProveedorInternoHijoRequest,
  ProveedorInternoRequest,
} from '../models/proveedor-interno.model';

@Injectable({ providedIn: 'root' })
export class ProveedoresInternosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/proveedores/internos`;

  getAll(soloActivos = false): Observable<ProveedorInterno[]> {
    const params = soloActivos ? new HttpParams().set('soloActivos', 'true') : undefined;
    return this.http.get<ProveedorInterno[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ProveedorInterno> {
    return this.http.get<ProveedorInterno>(`${this.baseUrl}/${id}`);
  }

  create(request: ProveedorInternoRequest): Observable<ProveedorInterno> {
    return this.http.post<ProveedorInterno>(this.baseUrl, request);
  }

  update(id: number, request: ProveedorInternoRequest): Observable<ProveedorInterno> {
    return this.http.put<ProveedorInterno>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getHijos(proveedorId: number): Observable<ProveedorInternoHijo[]> {
    return this.http.get<ProveedorInternoHijo[]>(`${this.baseUrl}/${proveedorId}/hijos`);
  }

  createHijo(proveedorId: number, request: ProveedorInternoHijoRequest): Observable<ProveedorInternoHijo> {
    return this.http.post<ProveedorInternoHijo>(`${this.baseUrl}/${proveedorId}/hijos`, request);
  }

  updateHijo(
    proveedorId: number,
    hijoId: number,
    request: ProveedorInternoHijoRequest
  ): Observable<ProveedorInternoHijo> {
    return this.http.put<ProveedorInternoHijo>(
      `${this.baseUrl}/${proveedorId}/hijos/${hijoId}`,
      request
    );
  }

  deleteHijo(proveedorId: number, hijoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${proveedorId}/hijos/${hijoId}`);
  }
}
