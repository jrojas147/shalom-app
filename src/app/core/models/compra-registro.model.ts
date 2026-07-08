import { CompraProveedorSeleccion } from './compra-proveedor.model';

export type CompraEstado = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';

export interface CompraDetalleLinea {
  id?: number;
  productoId: number;
  productoNombre?: string;
  pesoKg: number;
  empaque?: string | null;
  precioUnitario?: number;
  subtotal?: number;
}

export interface Compra {
  id: number;
  numeroFactura: string;
  estado: CompraEstado;
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
  }>;
  total?: number;
  pesoTotal?: number;
}

export interface RegistrarCompraResponse {
  compraId: number;
  factura: string;
  mensaje: string;
  estado: CompraEstado;
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
