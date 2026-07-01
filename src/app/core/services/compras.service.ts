import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CompraProveedorSeleccion, compraProveedorEtiqueta } from '../models/compra-proveedor.model';
import { CompraDetalleItem } from '../models/compra.model';

export interface ProcesarCompraRequest {
  proveedor: CompraProveedorSeleccion;
  items: CompraDetalleItem[];
  total: number;
  pesoTotal: number;
  metodo: 'TICKET' | 'CREDITO' | 'PAGO';
}

export interface ProcesarCompraResponse {
  factura: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private facturaCounter = 42;

  procesar(request: ProcesarCompraRequest): Observable<ProcesarCompraResponse> {
    const factura = String(this.facturaCounter++).padStart(4, '0');
    return of({
      factura,
      mensaje: `Compra procesada para ${compraProveedorEtiqueta(request.proveedor)} — ${request.metodo}`,
    });
  }
}
