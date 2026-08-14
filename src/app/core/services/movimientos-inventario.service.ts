import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  MovimientoInventario,
  RegistrarMovimientoRequest,
} from '../models/movimiento-inventario.model';

@Injectable({ providedIn: 'root' })
export class MovimientosInventarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/movimientos`;

  getAll(): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(this.baseUrl);
  }

  getById(id: number): Observable<MovimientoInventario> {
    return this.http.get<MovimientoInventario>(`${this.baseUrl}/${id}`);
  }

  registrar(request: RegistrarMovimientoRequest): Observable<MovimientoInventario> {
    return this.http.post<MovimientoInventario>(this.baseUrl, request);
  }
}
