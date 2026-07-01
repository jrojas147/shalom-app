import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { CodigoCiiu, CodigoCiiuRequest } from '../models/codigo-ciiu.model';

@Injectable({ providedIn: 'root' })
export class CodigosCiiuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/codigos-ciiu`;

  getAll(): Observable<CodigoCiiu[]> {
    return this.http.get<CodigoCiiu[]>(this.baseUrl);
  }

  getById(id: number): Observable<CodigoCiiu> {
    return this.http.get<CodigoCiiu>(`${this.baseUrl}/${id}`);
  }

  create(request: CodigoCiiuRequest): Observable<CodigoCiiu> {
    return this.http.post<CodigoCiiu>(this.baseUrl, request);
  }

  update(id: number, request: CodigoCiiuRequest): Observable<CodigoCiiu> {
    return this.http.put<CodigoCiiu>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
