import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  ConfiguracionCierreMes,
  ConfiguracionCierreMesRequest,
} from '../models/configuracion-cierre-mes.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionCierreMesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/cierre-mes`;

  get(): Observable<ConfiguracionCierreMes> {
    return this.http.get<ConfiguracionCierreMes>(this.baseUrl);
  }

  update(request: ConfiguracionCierreMesRequest): Observable<ConfiguracionCierreMes> {
    return this.http.put<ConfiguracionCierreMes>(this.baseUrl, request);
  }
}
