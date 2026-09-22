export interface TipoGasto {
  id: number;
  comercioId: number;
  nombre: string;
  sistema: boolean;
  activo: boolean;
}

export interface TipoGastoRequest {
  nombre: string;
  activo?: boolean;
}
