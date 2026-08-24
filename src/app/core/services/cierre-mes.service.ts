import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  CierreMesPreview,
  CierreMesResumen,
  EjecutarCierreMesRequest,
} from '../models/cierre-mes.model';

@Injectable({ providedIn: 'root' })
export class CierreMesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/inventario/cierre-mes`;

  previsualizar(): Observable<CierreMesPreview> {
    return this.http.get<CierreMesPreview>(`${this.baseUrl}/previsualizar`);
  }

  historial(): Observable<CierreMesResumen[]> {
    return this.http.get<CierreMesResumen[]>(this.baseUrl);
  }

  getById(id: number): Observable<CierreMesPreview> {
    return this.http.get<CierreMesPreview>(`${this.baseUrl}/${id}`);
  }

  ejecutar(request: EjecutarCierreMesRequest): Observable<CierreMesPreview> {
    return this.http.post<CierreMesPreview>(this.baseUrl, request);
  }
}
