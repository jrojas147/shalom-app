import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { CompraDetalleItem } from '../models/compra.model';
import { CompraProveedorSeleccion } from '../models/compra-proveedor.model';
import {
  Compra,
  CompraEstado,
  CompraResumen,
  RegistrarCompraRequest,
  RegistrarCompraResponse,
} from '../models/compra-registro.model';

export interface RegistrarPreCompraPayload {
  proveedor: CompraProveedorSeleccion;
  items: CompraDetalleItem[];
  total: number;
  pesoTotal: number;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/compras`;

  listar(estado: CompraEstado = 'PENDIENTE'): Observable<Compra[]> {
    const params = new HttpParams().set('estado', estado);
    return this.http.get<Compra[]>(this.baseUrl, { params });
  }

  getResumen(): Observable<CompraResumen> {
    return this.http.get<CompraResumen>(`${this.baseUrl}/resumen`);
  }

  obtener(id: number): Observable<Compra> {
    return this.http.get<Compra>(`${this.baseUrl}/${id}`);
  }

  registrarPreCompra(payload: RegistrarPreCompraPayload): Observable<RegistrarCompraResponse> {
    return this.http.post<RegistrarCompraResponse>(
      `${this.baseUrl}/pre-compra`,
      this.toRequest(payload)
    );
  }

  actualizar(id: number, payload: RegistrarPreCompraPayload): Observable<Compra> {
    return this.http.put<Compra>(`${this.baseUrl}/${id}`, this.toRequest(payload));
  }

  confirmar(id: number, payload?: RegistrarPreCompraPayload): Observable<RegistrarCompraResponse> {
    const url = `${this.baseUrl}/${id}/confirmar`;
    if (payload) {
      return this.http.post<RegistrarCompraResponse>(url, this.toRequest(payload));
    }
    return this.http.post<RegistrarCompraResponse>(url, null);
  }

  private toRequest(payload: RegistrarPreCompraPayload): RegistrarCompraRequest {
    return {
      proveedor: {
        tipo: payload.proveedor.tipo,
        proveedorId: payload.proveedor.proveedorId,
        sucursalId: payload.proveedor.sucursalId,
      },
      items: payload.items.map((item) => ({
        productoId: item.productoId,
        pesoKg: item.pesoKg,
        empaque: item.empaque,
      })),
      total: payload.total,
      pesoTotal: payload.pesoTotal,
    };
  }
}
