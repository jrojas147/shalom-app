export interface Sucursal {
  id: number;
  nombre: string;
  codigo?: string;
  direccion?: string;
  telefono?: string;
  activo: boolean;
}

export interface SucursalRequest {
  nombre: string;
  codigo?: string;
  direccion?: string;
  telefono?: string;
  activo?: boolean;
}
