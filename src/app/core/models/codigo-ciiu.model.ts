export type CodigoCiiuEstado = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';

export interface CodigoCiiu {
  id: number;
  codigo: string;
  nombre: string;
  siigoAccountGroupId?: number | null;
  estado: CodigoCiiuEstado;
  fechaEstado: string;
}

export interface CodigoCiiuRequest {
  codigo: string;
  nombre: string;
}

export interface CodigoCiiuSiigoItem {
  id: number;
  codigo?: string | null;
  nombre?: string | null;
  activo: boolean;
  yaSincronizado: boolean;
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
