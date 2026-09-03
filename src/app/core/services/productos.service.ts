import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { Producto, ProductoExcelImportResult, ProductoPrecioHistorial, ProductoRequest, ProductoSiigoCatalogo, ProductoSiigoCodigo, ProductoSiigoSyncResult } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/productos`;

  getAll(soloActivos = false): Observable<Producto[]> {
    const params = soloActivos ? new HttpParams().set('soloActivos', 'true') : undefined;
    return this.http.get<Producto[]>(this.baseUrl, { params });
  }

  getActivos(): Observable<Producto[]> {
    return this.getAll(true);
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }

  create(request: ProductoRequest, imagen?: File | null): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, this.buildFormData(request, imagen));
  }

  update(id: number, request: ProductoRequest, imagen?: File | null): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, this.buildFormData(request, imagen));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  downloadExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/excel`, { responseType: 'blob' });
  }

  importExcel(file: File): Observable<ProductoExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProductoExcelImportResult>(`${this.baseUrl}/excel`, formData);
  }

  listarSiigo(page = 1): Observable<ProductoSiigoCatalogo> {
    const params = new HttpParams().set('page', String(page));
    return this.http.get<ProductoSiigoCatalogo>(`${this.baseUrl}/siigo`, { params });
  }

  consultarCodigoSiigo(code: string): Observable<ProductoSiigoCodigo> {
    const params = new HttpParams().set('code', code);
    return this.http.get<ProductoSiigoCodigo>(`${this.baseUrl}/siigo/codigo`, { params });
  }

  sincronizarSiigo(ids: string[] = [], codes: string[] = []): Observable<ProductoSiigoSyncResult> {
    return this.http.post<ProductoSiigoSyncResult>(`${this.baseUrl}/sincronizar-siigo`, { ids, codes });
  }

  getHistorialPrecios(id: number): Observable<ProductoPrecioHistorial[]> {
    return this.http.get<ProductoPrecioHistorial[]>(`${this.baseUrl}/${id}/historial-precios`);
  }

  private buildFormData(request: ProductoRequest, imagen?: File | null): FormData {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(request)], { type: 'application/json' })
    );
    if (imagen) {
      formData.append('imagen', imagen);
    }
    return formData;
  }
}
