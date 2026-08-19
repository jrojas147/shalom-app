import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { MedioCaja, MedioCajaRequest } from '../models/medio-caja.model';

@Injectable({ providedIn: 'root' })
export class MediosCajaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/medios-caja`;

  getAll(soloActivos = false): Observable<MedioCaja[]> {
    const params = new HttpParams().set('soloActivos', String(soloActivos));
    return this.http.get<MedioCaja[]>(this.baseUrl, { params });
  }

  create(request: MedioCajaRequest): Observable<MedioCaja> {
    return this.http.post<MedioCaja>(this.baseUrl, request);
  }

  update(id: number, request: MedioCajaRequest): Observable<MedioCaja> {
    return this.http.put<MedioCaja>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
