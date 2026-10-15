import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { TipoProveedor } from '../models/proveedor.model';
import {
  ReporteCliente,
  ReporteCompra,
  ReporteCompraEstado,
  ReporteProveedor,
  ReporteRangoFechas,
  ReporteVenta,
} from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/reportes`;

  getCompras(rango: ReporteRangoFechas, estado: ReporteCompraEstado | null): Observable<ReporteCompra[]> {
    return this.http.get<ReporteCompra[]>(`${this.baseUrl}/compras`, {
      params: this.comprasParams(rango, estado),
    });
  }

  exportarCompras(rango: ReporteRangoFechas, estado: ReporteCompraEstado | null): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/compras/excel`, {
      params: this.comprasParams(rango, estado),
      responseType: 'blob',
    });
  }

  getVentas(rango: ReporteRangoFechas): Observable<ReporteVenta[]> {
    return this.http.get<ReporteVenta[]>(`${this.baseUrl}/ventas`, {
      params: this.rangoParams(rango),
    });
  }

  exportarVentas(rango: ReporteRangoFechas): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/ventas/excel`, {
      params: this.rangoParams(rango),
      responseType: 'blob',
    });
  }

  getClientes(soloActivos: boolean): Observable<ReporteCliente[]> {
    return this.http.get<ReporteCliente[]>(`${this.baseUrl}/clientes`, {
      params: new HttpParams().set('soloActivos', soloActivos),
    });
  }

  exportarClientes(soloActivos: boolean): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/clientes/excel`, {
      params: new HttpParams().set('soloActivos', soloActivos),
      responseType: 'blob',
    });
  }

  getProveedores(tipo: TipoProveedor | null, soloActivos: boolean): Observable<ReporteProveedor[]> {
    return this.http.get<ReporteProveedor[]>(`${this.baseUrl}/proveedores`, {
      params: this.proveedoresParams(tipo, soloActivos),
    });
  }

  exportarProveedores(tipo: TipoProveedor | null, soloActivos: boolean): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/proveedores/excel`, {
      params: this.proveedoresParams(tipo, soloActivos),
      responseType: 'blob',
    });
  }

  private rangoParams(rango: ReporteRangoFechas): HttpParams {
    return new HttpParams().set('desde', rango.desde).set('hasta', rango.hasta);
  }

  private comprasParams(rango: ReporteRangoFechas, estado: ReporteCompraEstado | null): HttpParams {
    const params = this.rangoParams(rango);
    return estado ? params.set('estado', estado) : params;
  }

  private proveedoresParams(tipo: TipoProveedor | null, soloActivos: boolean): HttpParams {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return tipo ? params.set('tipo', tipo) : params;
  }
}
