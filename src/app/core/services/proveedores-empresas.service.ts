import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { ProveedorEmpresa, ProveedorEmpresaRequest } from '../models/proveedor-empresa.model';

@Injectable({ providedIn: 'root' })
export class ProveedoresEmpresasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/proveedores/empresas`;

  getAll(soloActivas = false): Observable<ProveedorEmpresa[]> {
    const params = soloActivas ? new HttpParams().set('soloActivas', 'true') : undefined;
    return this.http.get<ProveedorEmpresa[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ProveedorEmpresa> {
    return this.http.get<ProveedorEmpresa>(`${this.baseUrl}/${id}`);
  }

  create(request: ProveedorEmpresaRequest): Observable<ProveedorEmpresa> {
    return this.http.post<ProveedorEmpresa>(this.baseUrl, request);
  }

  update(id: number, request: ProveedorEmpresaRequest): Observable<ProveedorEmpresa> {
    return this.http.put<ProveedorEmpresa>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
