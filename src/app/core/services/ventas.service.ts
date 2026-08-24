import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { RegistrarVentaPayload, RegistrarVentaResponse } from '../models/venta.model';
import { unidadesParaEnvio } from '../utils/tipo-medida.util';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/ventas`;

  registrar(payload: RegistrarVentaPayload): Observable<RegistrarVentaResponse> {
    return this.http.post<RegistrarVentaResponse>(this.baseUrl, {
      clienteId: payload.cliente.clienteId,
      items: payload.items.map((item) => ({
        productoId: item.productoId,
        pesoKg: item.pesoKg,
        empaque: item.empaque,
        unidades: unidadesParaEnvio(item.producto, item.unidades),
        cantidadEmpaques: item.cantidadEmpaques ?? 1,
      })),
      total: payload.total,
      pesoTotal: payload.pesoTotal,
      medioCajaId: payload.medioCajaId,
    });
  }
}
