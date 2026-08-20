export interface TipoEmpaque {
  id: number;
  comercioId: number;
  nombre: string;
  peso: number;
  activo: boolean;
}

export interface TipoEmpaqueRequest {
  nombre: string;
  peso: number;
}
