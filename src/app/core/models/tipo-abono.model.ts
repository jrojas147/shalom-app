export interface TipoAbono {
  id: number;
  comercioId: number;
  nombre: string;
  activo: boolean;
}

export interface TipoAbonoRequest {
  nombre: string;
  activo?: boolean;
}
