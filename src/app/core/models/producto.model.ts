export type CategoriaProducto = 'PLASTICOS' | 'METALES' | 'PAPEL' | 'VIDRIO' | 'CHATARRA';

export type ProductoEstado = 'ACTIVO' | 'INACTIVO';

export interface Producto {
  id: number;
  nombre: string;
  clasificacion: string;
  categoria: CategoriaProducto;
  stock: number;
  stockUnidad: string;
  precioPorKg: number;
  estado: ProductoEstado;
  imagenUrl: string;
}

export interface CategoriaFiltro {
  id: 'TODOS' | CategoriaProducto;
  label: string;
  icon: 'todos' | 'plasticos' | 'metales' | 'papel' | 'vidrio';
}
