import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  Categoria,
  CategoriaRequest,
  CategoriaSiigoCatalogo,
  CategoriaSiigoSyncResult,
} from '../models/categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/categorias`;

  getAll(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.baseUrl);
  }

  create(request: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.baseUrl, request);
  }

  update(id: number, request: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarSiigo(page = 1): Observable<CategoriaSiigoCatalogo> {
    const params = new HttpParams().set('page', String(page));
    return this.http.get<CategoriaSiigoCatalogo>(`${this.baseUrl}/siigo`, { params });
  }

  sincronizarSiigo(ids: number[]): Observable<CategoriaSiigoSyncResult> {
    return this.http.post<CategoriaSiigoSyncResult>(`${this.baseUrl}/sincronizar-siigo`, { ids });
  }
}
