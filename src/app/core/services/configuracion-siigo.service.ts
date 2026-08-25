import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  ConfiguracionSiigo,
  ConfiguracionSiigoRequest,
  SiigoCatalogoItem,
  SiigoPrueba,
} from '../models/configuracion-siigo.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionSiigoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/siigo`;

  get(): Observable<ConfiguracionSiigo> {
    return this.http.get<ConfiguracionSiigo>(this.baseUrl);
  }

  update(request: ConfiguracionSiigoRequest): Observable<ConfiguracionSiigo> {
    return this.http.put<ConfiguracionSiigo>(this.baseUrl, request);
  }

  probar(): Observable<SiigoPrueba> {
    return this.http.post<SiigoPrueba>(`${this.baseUrl}/probar`, {});
  }

  documentos(type = 'FV'): Observable<SiigoCatalogoItem[]> {
    const params = new HttpParams().set('type', type);
    return this.http.get<SiigoCatalogoItem[]>(`${this.baseUrl}/documentos`, { params });
  }

  mediosPago(): Observable<SiigoCatalogoItem[]> {
    return this.http.get<SiigoCatalogoItem[]>(`${this.baseUrl}/medios-pago`);
  }

  vendedores(): Observable<SiigoCatalogoItem[]> {
    return this.http.get<SiigoCatalogoItem[]>(`${this.baseUrl}/vendedores`);
  }

  gruposCuenta(): Observable<SiigoCatalogoItem[]> {
    const url = `${this.baseUrl}/grupos-cuenta`;
    console.log('[Siigo] GET grupos productos', url);
    return this.http.get<SiigoCatalogoItem[]>(url).pipe(
      tap({
        next: (data) => console.log('[Siigo] GET grupos productos respuesta', data),
        error: (err) => console.error('[Siigo] GET grupos productos error', err),
      })
    );
  }
}
