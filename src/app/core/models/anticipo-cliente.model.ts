export interface AnticipoCliente {
  id: number;
  clienteId: number;
  cajaId: number;
  medioCajaId: number;
  medioCajaNombre?: string;
  monto: number;
  montoAplicado: number;
  saldoPendiente: number;
  observacion?: string | null;
  activo: boolean;
  createdAt: string;
}

export interface AnticipoClienteSaldo {
  clienteId: number;
  saldoPendiente: number;
}

export interface RegistrarAnticipoClienteRequest {
  medioCajaId: number;
  monto: number;
  observacion?: string;
}
