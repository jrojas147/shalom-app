export type CodigoCiiuEstado = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';

export interface CodigoCiiu {
  id: number;
  codigo: string;
  nombre: string;
  categoriaId?: number | null;
  categoriaCodigo?: string | null;
  categoriaNombre?: string | null;
  unidadMedidaId?: number | null;
  unidadMedidaCodigo?: string | null;
  unidadMedidaNombre?: string | null;
  siigoAccountGroupId?: number | null;
  siigoId?: string | null;
  estado: CodigoCiiuEstado;
  fechaEstado: string;
}

export interface CodigoCiiuRequest {
  codigo: string;
  nombre: string;
  categoriaId?: number | null;
  unidadMedidaId?: number | null;
}

export interface CodigoCiiuSiigoCodigo {
  existe: boolean;
  codigo?: string | null;
  nombre?: string | null;
  siigoId?: string | null;
}

export interface CodigoCiiuSiigoItem {
  id: string;
  codigo?: string | null;
  nombre?: string | null;
  activo: boolean;
  yaSincronizado: boolean;
}

export interface CodigoCiiuSiigoCatalogo {
  page: number;
  pageSize: number;
  total: number;
  hayMas: boolean;
  items: CodigoCiiuSiigoItem[];
}

export interface CodigoCiiuSiigoSyncError {
  codigo: string;
  mensaje: string;
}

export interface CodigoCiiuSiigoSyncResult {
  consultados: number;
  creados: number;
  actualizados: number;
  errores: number;
  detalleErrores: CodigoCiiuSiigoSyncError[];
}
