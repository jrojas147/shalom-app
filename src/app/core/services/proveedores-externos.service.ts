import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { ProveedorExterno, ProveedorExternoRequest } from '../models/proveedor-externo.model';

@Injectable({ providedIn: 'root' })
export class ProveedoresExternosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/proveedores/externos`;

  getAll(soloActivos = false): Observable<ProveedorExterno[]> {
    const params = soloActivos ? new HttpParams().set('soloActivos', 'true') : undefined;
    return this.http.get<ProveedorExterno[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ProveedorExterno> {
    return this.http.get<ProveedorExterno>(`${this.baseUrl}/${id}`);
  }

  create(request: ProveedorExternoRequest): Observable<ProveedorExterno> {
    return this.http.post<ProveedorExterno>(this.baseUrl, request);
  }

  update(id: number, request: ProveedorExternoRequest): Observable<ProveedorExterno> {
    return this.http.put<ProveedorExterno>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
