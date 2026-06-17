export interface Proveedor {
  id: number;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface ProveedorRequest {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}
