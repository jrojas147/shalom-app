import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { CompraResumen } from '../models/compra-registro.model';
import { VentaResumen } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class InicioService {
  private readonly http = inject(HttpClient);
  private readonly resumenComprasUrl = `${API_CORE_URL}/api/compras/resumen`;
  private readonly resumenVentasUrl = `${API_CORE_URL}/api/ventas/resumen`;

  /** Totales de compras confirmadas del comercio activo (hoy, semana y mes, en dinero y kilos). */
  getResumenCompras(): Observable<CompraResumen> {
    return this.http.get<CompraResumen>(this.resumenComprasUrl);
  }

  /** Totales de ventas del comercio activo (hoy, semana y mes, en dinero y kilos). */
  getResumenVentas(): Observable<VentaResumen> {
    return this.http.get<VentaResumen>(this.resumenVentasUrl);
  }
}
