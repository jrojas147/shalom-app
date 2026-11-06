import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { ConfiguracionIva, ConfiguracionIvaRequest } from '../models/configuracion-iva.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionIvaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/iva`;

  get(): Observable<ConfiguracionIva> {
    return this.http.get<ConfiguracionIva>(this.baseUrl);
  }

  update(request: ConfiguracionIvaRequest): Observable<ConfiguracionIva> {
    return this.http.put<ConfiguracionIva>(this.baseUrl, request);
  }
}
