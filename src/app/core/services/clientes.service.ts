import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  AnticipoCliente,
  AnticipoClienteSaldo,
  RegistrarAnticipoClienteRequest,
} from '../models/anticipo-cliente.model';
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

  listarAnticipos(clienteId: number): Observable<AnticipoCliente[]> {
    return this.http.get<AnticipoCliente[]>(`${this.baseUrl}/${clienteId}/anticipos`);
  }

  saldoAnticipos(clienteId: number): Observable<AnticipoClienteSaldo> {
    return this.http.get<AnticipoClienteSaldo>(`${this.baseUrl}/${clienteId}/anticipos/saldo`);
  }

  registrarAnticipo(
    clienteId: number,
    request: RegistrarAnticipoClienteRequest
  ): Observable<AnticipoCliente> {
    return this.http.post<AnticipoCliente>(`${this.baseUrl}/${clienteId}/anticipos`, request);
  }
}
