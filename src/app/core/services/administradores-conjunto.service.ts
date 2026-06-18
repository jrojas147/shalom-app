import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  AdministradorConjunto,
  AdministradorConjuntoRequest,
} from '../models/administrador-conjunto.model';
import { Sucursal } from '../models/sucursal.model';

@Injectable({ providedIn: 'root' })
export class AdministradoresConjuntoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/sucursales/administradores`;

  getAll(soloActivos = false): Observable<AdministradorConjunto[]> {
    const params = soloActivos ? new HttpParams().set('soloActivos', 'true') : undefined;
    return this.http.get<AdministradorConjunto[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<AdministradorConjunto> {
    return this.http.get<AdministradorConjunto>(`${this.baseUrl}/${id}`);
  }

  getConjuntos(id: number): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.baseUrl}/${id}/conjuntos`);
  }

  create(request: AdministradorConjuntoRequest): Observable<AdministradorConjunto> {
    return this.http.post<AdministradorConjunto>(this.baseUrl, request);
  }

  update(id: number, request: AdministradorConjuntoRequest): Observable<AdministradorConjunto> {
    return this.http.put<AdministradorConjunto>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
