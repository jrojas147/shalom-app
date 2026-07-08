import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { Cliente, ClienteRequest } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/clientes`;

  getAll(soloActivos = false): Observable<Cliente[]> {
    const params = soloActivos ? new HttpParams().set('soloActivos', 'true') : undefined;
    return this.http.get<Cliente[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  create(request: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.baseUrl, request);
  }

  update(id: number, request: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
