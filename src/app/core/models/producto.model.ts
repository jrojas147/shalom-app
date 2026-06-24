import { API_CORE_URL } from '../config/api.config';

export type CategoriaProducto = 'PLASTICOS' | 'METALES' | 'PAPEL' | 'VIDRIO' | 'CHATARRA';

export interface Producto {
  id: number;
  comercioId: number;
  nombreInterno: string;
  activo: boolean;
  codigoCiiu?: string | null;
  nombreCiiu?: string | null;
  categoriaProducto?: string | null;
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
  categoriaProducto?: string;
  precioCompra?: number | null;
  precioVenta?: number | null;
  descripcion?: string;
  imagen?: string;
}

export interface ProductoImagenUploadResponse {
  url: string;
}

export interface CategoriaFiltro {
  id: 'TODOS' | CategoriaProducto;
  label: string;
  icon: 'todos' | 'plasticos' | 'metales' | 'papel' | 'vidrio';
}

export const CATEGORIAS_PRODUCTO: { value: CategoriaProducto; label: string }[] = [
  { value: 'PLASTICOS', label: 'Plásticos' },
  { value: 'METALES', label: 'Metales' },
  { value: 'PAPEL', label: 'Papel/Cartón' },
  { value: 'VIDRIO', label: 'Vidrio' },
  { value: 'CHATARRA', label: 'Chatarra' },
];

export function categoriaProductoLabel(value?: string | null): string {
  if (!value) return '—';
  const found = CATEGORIAS_PRODUCTO.find(
    (c) => c.value === value.toUpperCase()
  );
  return found?.label ?? value;
}

export function categoriaProductoFiltro(producto: Producto): CategoriaProducto | null {
  if (!producto.categoriaProducto) return null;
  const upper = producto.categoriaProducto.toUpperCase();
  return CATEGORIAS_PRODUCTO.some((c) => c.value === upper)
    ? (upper as CategoriaProducto)
    : null;
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
