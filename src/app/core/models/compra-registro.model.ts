import { CompraProveedorSeleccion } from './compra-proveedor.model';

export type CompraEstado = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';
export type CompraEstadoPago = 'PENDIENTE' | 'PAGADO';

export interface CompraDetalleLinea {
  id?: number;
  productoId: number;
  productoNombre?: string;
  pesoKg: number;
  empaque?: string | null;
  precioUnitario?: number;
  subtotal?: number;
  unidades?: number | null;
  cantidadEmpaques?: number | null;
}

export interface CompraResumen {
  totalHoy: number;
  pesoHoy: number;
  cantidadHoy: number;
  totalSemana: number;
  pesoSemana: number;
  cantidadSemana: number;
  totalMes: number;
  pesoMes: number;
  cantidadMes: number;
}

export interface Compra {
  id: number;
  numeroFactura: string;
  estado: CompraEstado;
  estadoPago: CompraEstadoPago;
  proveedorTipo: CompraProveedorSeleccion['tipo'];
  proveedorId: number;
  proveedorNombre?: string;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  total: number;
  pesoTotal: number;
  usuarioRegistroId: number;
  usuarioRegistroNombre?: string;
  usuarioConfirmacionId?: number | null;
  confirmedAt?: string | null;
  createdAt: string;
  detalle: CompraDetalleLinea[];
}

export interface RegistrarCompraRequest {
  proveedor: {
    tipo: CompraProveedorSeleccion['tipo'];
    proveedorId: number;
    sucursalId?: number;
  };
  items: Array<{
    productoId: number;
    pesoKg: number;
    empaque?: string;
    unidades?: number;
    cantidadEmpaques?: number;
  }>;
  total?: number;
  pesoTotal?: number;
}

export interface RegistrarCompraResponse {
  compraId: number;
  factura: string;
  mensaje: string;
  estado: CompraEstado;
  estadoPago: CompraEstadoPago;
  totalCompra?: number;
  anticipoAplicado?: number;
  montoPagadoCaja?: number;
}

export function compraProveedorFromCompra(compra: Compra): CompraProveedorSeleccion {
  return {
    tipo: compra.proveedorTipo,
    proveedorId: compra.proveedorId,
    nombre: compra.proveedorNombre ?? 'Proveedor',
    sucursalId: compra.sucursalId ?? undefined,
    sucursalNombre: compra.sucursalNombre ?? undefined,
  };
}
