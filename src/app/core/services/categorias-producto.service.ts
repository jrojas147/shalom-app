import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  CategoriaProductoItem,
  CategoriaProductoRequest,
} from '../models/categoria-producto.model';

@Injectable({ providedIn: 'root' })
export class CategoriasProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/categorias-producto`;

  getAll(soloActivos = false): Observable<CategoriaProductoItem[]> {
    const params = soloActivos ? new HttpParams().set('soloActivos', 'true') : undefined;
    return this.http.get<CategoriaProductoItem[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<CategoriaProductoItem> {
    return this.http.get<CategoriaProductoItem>(`${this.baseUrl}/${id}`);
  }

  create(request: CategoriaProductoRequest): Observable<CategoriaProductoItem> {
    return this.http.post<CategoriaProductoItem>(this.baseUrl, request);
  }

  update(id: number, request: CategoriaProductoRequest): Observable<CategoriaProductoItem> {
    return this.http.put<CategoriaProductoItem>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
