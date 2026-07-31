import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_CORE_URL } from '../config/api.config';
import { AbrirCajaRequest, Caja, CerrarCajaRequest } from '../models/caja.model';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/caja`;

  obtenerActual(): Observable<Caja | null> {
    return this.http.get<Caja>(`${this.baseUrl}/actual`).pipe(
      catchError((err) => {
        if (err?.status === 204) {
          return of(null);
        }
        throw err;
      })
    );
  }

  abrir(payload: AbrirCajaRequest): Observable<Caja> {
    return this.http.post<Caja>(`${this.baseUrl}/abrir`, payload);
  }

  cerrar(payload: CerrarCajaRequest): Observable<Caja> {
    return this.http.post<Caja>(`${this.baseUrl}/cerrar`, payload);
  }
}
