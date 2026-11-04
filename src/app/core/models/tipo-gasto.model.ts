export interface TipoGasto {
  id: number;
  comercioId: number;
  nombre: string;
  cuentaSiigo?: string | null;
  sistema: boolean;
  activo: boolean;
}

export interface TipoGastoRequest {
  nombre: string;
  cuentaSiigo?: string | null;
  activo?: boolean;
}
