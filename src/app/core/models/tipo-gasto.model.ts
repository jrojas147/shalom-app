export interface TipoGasto {
  id: number;
  comercioId: number;
  nombre: string;
  activo: boolean;
}

export interface TipoGastoRequest {
  nombre: string;
  activo?: boolean;
}
