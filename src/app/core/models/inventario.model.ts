import { TipoProveedor } from './proveedor.model';

export type InventarioEstado = 'DISPONIBLE' | 'AGOTADO' | 'SALIDA' | 'BLOQUEADO';

export interface ExistenciaProducto {
  codigoProducto: number;
  nombreProducto: string;
  cantidadDisponible: number;
  unidadesDisponibles?: number | null;
}

export interface InventarioConsolidadoSuiItem {
  codigoSui: string;
  nombreSui: string;
  saldoKg: number;
  compraKg: number;
  ventaKg: number;
  stockKg: number;
}

export interface InventarioConsolidadoSui {
  tieneCierre: boolean;
  ultimoCierreLabel?: string | null;
  periodoDesde: string;
  periodoHasta: string;
  items: InventarioConsolidadoSuiItem[];
}

export interface InventarioResumenSui {
  codigoSui: string;
  nombreSui: string;
  cantidadDisponible: number;
  cantidadProductos: number;
}

export interface InventarioProductoVendido {
  codigoProducto: number;
  nombreProducto: string;
  codigoSui?: string | null;
  nombreSui?: string | null;
  cantidadDisponible: number;
  pesoVendido: number;
}

export interface InventarioEntrada {
  idInventario: number;
  comercioId: number;
  codigoProducto: number;
  nombreProducto: string;
  cantidadDisponible: number;
  precioCompraUnitario: number | null;
  precioVentaUnitario: number | null;
  proveedorTipo: TipoProveedor;
  proveedorId: number;
  proveedorNombre?: string | null;
  sucursalId: number | null;
  sucursalNombre?: string | null;
  fechaEntrada: string;
  fechaSalida: string | null;
  estado: InventarioEstado;
  ubicacion: string | null;
  usuarioRegistro: number;
  compraDetalleId: number | null;
  unidades?: number | null;
}

export const INVENTARIO_ESTADOS: InventarioEstado[] = [
  'DISPONIBLE',
  'AGOTADO',
  'SALIDA',
  'BLOQUEADO',
];

export function inventarioEstadoLabel(estado: InventarioEstado): string {
  switch (estado) {
    case 'DISPONIBLE':
      return 'Disponible';
    case 'AGOTADO':
      return 'Agotado';
    case 'SALIDA':
      return 'Salida';
    case 'BLOQUEADO':
      return 'Bloqueado';
  }
}
