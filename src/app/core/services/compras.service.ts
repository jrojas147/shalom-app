import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CompraDetalleItem } from '../models/compra.model';
import { Cliente } from '../models/cliente.model';

export interface ProcesarCompraRequest {
  cliente: Cliente;
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
      mensaje: `Compra procesada para ${request.cliente.nombre} — ${request.metodo}`,
    });
  }
}
