import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { ExistenciaProducto, InventarioEntrada } from '../models/inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/inventario`;

  getResumen(): Observable<ExistenciaProducto[]> {
    return this.http.get<ExistenciaProducto[]>(`${this.baseUrl}/resumen`);
  }

  getAll(): Observable<InventarioEntrada[]> {
    return this.http.get<InventarioEntrada[]>(this.baseUrl);
  }

  getById(id: number): Observable<InventarioEntrada> {
    return this.http.get<InventarioEntrada>(`${this.baseUrl}/${id}`);
  }

  getByProducto(productoId: number): Observable<InventarioEntrada[]> {
    return this.http.get<InventarioEntrada[]>(`${this.baseUrl}/productos/${productoId}`);
  }

  getExistenciaProducto(productoId: number): Observable<ExistenciaProducto> {
    return this.http.get<ExistenciaProducto>(`${this.baseUrl}/productos/${productoId}/existencia`);
  }
}
