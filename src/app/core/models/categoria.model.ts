export type CategoriaEstado = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';

export interface Categoria {
  id: number;
  codigo: string;
  nombre: string;
  siigoAccountGroupId?: number | null;
  estado: CategoriaEstado;
  fechaEstado: string;
}

export interface CategoriaRequest {
  codigo: string;
  nombre: string;
}

export interface CategoriaSiigoItem {
  id: number;
  codigo?: string | null;
  nombre?: string | null;
  activo: boolean;
  yaSincronizado: boolean;
}

export interface CategoriaSiigoSyncError {
  codigo: string;
  mensaje: string;
}

export interface CategoriaSiigoSyncResult {
  consultados: number;
  creados: number;
  actualizados: number;
  errores: number;
  detalleErrores: CategoriaSiigoSyncError[];
}
