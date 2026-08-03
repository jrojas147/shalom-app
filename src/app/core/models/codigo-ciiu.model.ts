export type CodigoCiiuEstado = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';

export interface CodigoCiiu {
  id: number;
  codigo: string;
  nombre: string;
  estado: CodigoCiiuEstado;
  fechaEstado: string;
}

export interface CodigoCiiuRequest {
  codigo: string;
  nombre: string;
}
