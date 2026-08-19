import { MedioCajaTipo } from './medio-caja.model';

export type CajaEstado = 'ABIERTA' | 'CERRADA';
export type CajaMovimientoTipo = 'INGRESO' | 'EGRESO';
export type CajaMovimientoConcepto =
  | 'APERTURA'
  | 'VENTA'
  | 'COMPRA'
  | 'PAGO_PROVEEDOR'
  | 'AJUSTE'
  | 'CIERRE'
  | 'ABONO_CAJA';

export interface CajaMovimiento {
  id: number;
  cajaId: number;
  tipo: CajaMovimientoTipo;
  concepto: CajaMovimientoConcepto;
  monto: number;
  referenciaTipo?: 'COMPRA' | 'VENTA' | null;
  referenciaId?: number | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre?: string;
  medioCajaId?: number | null;
  medioCajaNombre?: string | null;
  observacion?: string | null;
  createdAt: string;
}

export interface CajaSaldo {
  medioCajaId: number;
  medioNombre: string;
  medioTipo?: MedioCajaTipo | null;
  detalle?: string | null;
  saldoInicial: number;
  saldoActual: number;
}

export interface Caja {
  id: number;
  comercioId: number;
  usuarioAperturaId: number;
  usuarioAperturaNombre?: string;
  usuarioCierreId?: number | null;
  usuarioCierreNombre?: string | null;
  saldoInicial: number;
  saldoActual: number;
  saldoCierre?: number | null;
  saldoTeorico?: number | null;
  diferencia?: number | null;
  totalIngresos?: number;
  totalEgresos?: number;
  totalVentas?: number;
  totalPagosProveedor?: number;
  estado: CajaEstado;
  openedAt: string;
  closedAt?: string | null;
  observacion?: string | null;
  saldos?: CajaSaldo[];
  movimientos: CajaMovimiento[];
}

export interface CajaSaldoAperturaRequest {
  medioCajaId: number;
  saldoInicial: number;
}

export interface AbrirCajaRequest {
  saldoInicial?: number;
  saldos?: CajaSaldoAperturaRequest[];
  observacion?: string;
}

export interface CerrarCajaRequest {
  saldoCierre: number;
  observacion?: string;
}

export interface AbonoCajaRequest {
  monto: number;
  medioCajaId?: number;
  observacion?: string;
}

export const CAJA_CONCEPTO_LABEL: Record<CajaMovimientoConcepto, string> = {
  APERTURA: 'Apertura',
  VENTA: 'Venta',
  COMPRA: 'Compra',
  PAGO_PROVEEDOR: 'Pago proveedor',
  AJUSTE: 'Ajuste',
  CIERRE: 'Cierre',
  ABONO_CAJA: 'Abono a caja',
};
