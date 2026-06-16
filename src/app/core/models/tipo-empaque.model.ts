export interface TipoEmpaque {
  id: number;
  comercioId: number;
  nombre: string;
  peso: number;
}

export interface TipoEmpaqueRequest {
  nombre: string;
  peso: number;
}
