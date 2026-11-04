export interface Gasto {
  id: number;
  cajaId: number;
  tipoGastoId: number;
  tipoGastoNombre: string;
  medioCajaId: number;
  medioCajaNombre: string;
  monto: number;
  observacion?: string | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre?: string;
  siigoId?: string | null;
  mensaje?: string | null;
  createdAt: string;
}

export interface RegistrarGastoRequest {
  tipoGastoId: number;
  medioCajaId: number;
  monto: number;
  observacion?: string;
}
