import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { Gasto, RegistrarGastoRequest } from '../models/gasto.model';

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/gastos`;

  listar(): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(this.baseUrl);
  }

  registrar(payload: RegistrarGastoRequest): Observable<Gasto> {
    return this.http.post<Gasto>(this.baseUrl, payload);
  }
}
