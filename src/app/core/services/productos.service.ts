import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { Producto, ProductoImagenUploadResponse, ProductoRequest } from '../models/producto.model';

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

  create(request: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, request);
  }

  update(id: number, request: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  uploadImagen(file: File): Observable<ProductoImagenUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProductoImagenUploadResponse>(`${this.baseUrl}/imagen`, formData);
  }
}
