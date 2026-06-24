export interface CategoriaProductoItem {
  id: number;
  comercioId: number;
  nombre: string;
  activo: boolean;
}

export interface CategoriaProductoRequest {
  nombre: string;
  activo?: boolean;
}
