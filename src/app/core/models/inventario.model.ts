import { TipoProveedor } from './proveedor.model';

export type InventarioEstado = 'DISPONIBLE' | 'AGOTADO' | 'SALIDA' | 'BLOQUEADO';

export interface ExistenciaProducto {
  codigoProducto: number;
  nombreProducto: string;
  cantidadDisponible: number;
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
  sucursalId: number | null;
  fechaEntrada: string;
  fechaSalida: string | null;
  estado: InventarioEstado;
  ubicacion: string | null;
  usuarioRegistro: number;
  compraDetalleId: number | null;
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
