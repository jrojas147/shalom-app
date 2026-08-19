import { API_CORE_URL } from '../config/api.config';

export type ProductoEstado = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';

export interface Producto {
  id: number;
  comercioId: number;
  nombreInterno: string;
  activo: boolean;
  estado: ProductoEstado;
  fechaEstado: string;
  codigoCiiuId?: number | null;
  codigoCiiu?: string | null;
  nombreCiiu?: string | null;
  precioCompra?: number | null;
  precioVenta?: number | null;
  descripcion?: string | null;
  imagen?: string | null;
}

export interface ProductoRequest {
  nombreInterno: string;
  activo?: boolean;
  codigoCiiuId?: number | null;
  precioCompra?: number | null;
  precioVenta?: number | null;
  descripcion?: string;
  eliminarImagen?: boolean;
}

export interface ProductoExcelFilaError {
  fila: number;
  mensaje: string;
}

export interface ProductoExcelImportResult {
  creados: number;
  actualizados: number;
  errores: number;
  detalleErrores: ProductoExcelFilaError[];
}

export interface ProductoPrecioHistorial {
  id: number;
  productoId: number;
  precioCompraAnterior?: number | null;
  precioVentaAnterior?: number | null;
  precioCompraNuevo?: number | null;
  precioVentaNuevo?: number | null;
  usuarioId: number;
  usuarioNombre: string;
  createdAt: string;
}

export function productoImagenUrl(imagen?: string | null): string | null {
  if (!imagen) {
    return null;
  }
  if (imagen.startsWith('http://') || imagen.startsWith('https://') || imagen.startsWith('blob:')) {
    return imagen;
  }
  const path = imagen.startsWith('/') ? imagen : `/${imagen}`;
  return `${API_CORE_URL}${path}`;
}

export function productoPrecioKg(producto: Producto): number {
  return producto.precioCompra ?? producto.precioVenta ?? 0;
}
