export interface AnticipoProveedorInterno {
  id: number;
  recicladorId: number;
  cajaId: number;
  medioCajaId: number;
  medioCajaNombre?: string;
  monto: number;
  montoAplicado: number;
  saldoPendiente: number;
  observacion?: string | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre?: string;
  activo: boolean;
  createdAt: string;
}

export interface AnticipoSaldo {
  recicladorId: number;
  saldoPendiente: number;
}

export interface RegistrarAnticipoRequest {
  medioCajaId: number;
  monto: number;
  observacion?: string;
}
