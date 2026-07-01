import { API_CORE_URL } from '../config/api.config';

export interface Producto {
  id: number;
  comercioId: number;
  nombreInterno: string;
  activo: boolean;
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
  codigoCiiu?: string;
  nombreCiiu?: string;
  precioCompra?: number | null;
  precioVenta?: number | null;
  descripcion?: string;
  eliminarImagen?: boolean;
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
