export interface CajaCierreMedioComprobante {
  nombre: string;
  detalle?: string | null;
  saldoTeorico: number;
  saldoCierre: number;
  diferencia: number;
}

export interface CajaCierreComprobanteData {
  cajaId: number;
  comercioNombre: string;
  usuarioApertura: string;
  usuarioCierre: string;
  openedAt: Date;
  closedAt: Date;
  saldoInicial: number;
  totalVentas: number;
  totalPagosProveedor: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoTeorico: number;
  saldoCierre: number;
  diferencia: number;
  observacion?: string | null;
  medios: CajaCierreMedioComprobante[];
}
