import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { CompraResumen } from '../models/compra-registro.model';

@Injectable({ providedIn: 'root' })
export class InicioService {
  private readonly http = inject(HttpClient);
  private readonly resumenUrl = `${API_CORE_URL}/api/compras/resumen`;

  /** Totales de compras confirmadas del comercio activo (hoy y semana en curso). */
  getResumenCompras(): Observable<CompraResumen> {
    return this.http.get<CompraResumen>(this.resumenUrl);
  }
}
