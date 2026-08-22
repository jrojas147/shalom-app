import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { BasculaPeso } from '../models/bascula.model';

@Injectable({ providedIn: 'root' })
export class BasculaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/bascula`;

  leerPeso(): Observable<BasculaPeso> {
    return this.http.get<BasculaPeso>(`${this.baseUrl}/peso`);
  }
}
