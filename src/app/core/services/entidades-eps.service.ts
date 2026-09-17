import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { EntidadEps } from '../models/entidad-eps.model';

@Injectable({ providedIn: 'root' })
export class EntidadesEpsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/eps`;

  getAll(): Observable<EntidadEps[]> {
    return this.http.get<EntidadEps[]>(this.baseUrl);
  }
}
