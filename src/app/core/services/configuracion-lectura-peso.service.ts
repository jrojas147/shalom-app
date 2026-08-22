import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  ConfiguracionLecturaPeso,
  ConfiguracionLecturaPesoRequest,
} from '../models/configuracion-lectura-peso.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionLecturaPesoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/lectura-peso`;

  get(): Observable<ConfiguracionLecturaPeso> {
    return this.http.get<ConfiguracionLecturaPeso>(this.baseUrl);
  }

  update(request: ConfiguracionLecturaPesoRequest): Observable<ConfiguracionLecturaPeso> {
    return this.http.put<ConfiguracionLecturaPeso>(this.baseUrl, request);
  }
}
