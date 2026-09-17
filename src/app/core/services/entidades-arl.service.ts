import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { EntidadArl } from '../models/entidad-arl.model';

@Injectable({ providedIn: 'root' })
export class EntidadesArlService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/arls`;

  getAll(): Observable<EntidadArl[]> {
    return this.http.get<EntidadArl[]>(this.baseUrl);
  }
}
