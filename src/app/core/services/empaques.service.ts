import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  EmpaqueBodega,
  EmpaqueContraparteTipo,
  EmpaqueMovimiento,
  EmpaqueResumen,
  EmpaqueSaldo,
  RegistrarEmpaqueBodegaRequest,
  RegistrarEmpaqueMovimientoRequest,
} from '../models/empaque.model';

@Injectable({ providedIn: 'root' })
export class EmpaquesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/empaques`;

  resumen(): Observable<EmpaqueResumen> {
    return this.http.get<EmpaqueResumen>(`${this.baseUrl}/resumen`);
  }

  saldos(contraparteTipo?: EmpaqueContraparteTipo): Observable<EmpaqueSaldo[]> {
    let params = new HttpParams();
    if (contraparteTipo) {
      params = params.set('contraparteTipo', contraparteTipo);
    }
    return this.http.get<EmpaqueSaldo[]>(`${this.baseUrl}/saldos`, { params });
  }

  movimientos(contraparteTipo?: EmpaqueContraparteTipo): Observable<EmpaqueMovimiento[]> {
    let params = new HttpParams();
    if (contraparteTipo) {
      params = params.set('contraparteTipo', contraparteTipo);
    }
    return this.http.get<EmpaqueMovimiento[]>(`${this.baseUrl}/movimientos`, { params });
  }

  registrar(request: RegistrarEmpaqueMovimientoRequest): Observable<EmpaqueMovimiento> {
    return this.http.post<EmpaqueMovimiento>(`${this.baseUrl}/movimientos`, request);
  }

  bodega(): Observable<EmpaqueBodega[]> {
    return this.http.get<EmpaqueBodega[]>(`${this.baseUrl}/bodega`);
  }

  registrarBodega(request: RegistrarEmpaqueBodegaRequest): Observable<EmpaqueMovimiento> {
    return this.http.post<EmpaqueMovimiento>(`${this.baseUrl}/bodega`, request);
  }

  anular(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/movimientos/${id}/anular`, {});
  }
}
