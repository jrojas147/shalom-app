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
  observacion?: string | null;
  createdAt: string;
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
  movimientos: CajaMovimiento[];
}

export interface AbrirCajaRequest {
  saldoInicial: number;
  observacion?: string;
}

export interface CerrarCajaRequest {
  saldoCierre: number;
  observacion?: string;
}

export interface AbonoCajaRequest {
  monto: number;
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
