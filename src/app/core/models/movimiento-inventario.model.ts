export interface MovimientoInventario {
  id: number;
  comercioId: number;
  productoOrigenId: number;
  productoOrigenNombre: string;
  productoDestinoId: number;
  productoDestinoNombre: string;
  cantidadKg: number;
  observacion?: string | null;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  inventarioEntradaId?: number | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre?: string | null;
  createdAt: string;
  existenciaOrigen?: number | null;
  existenciaDestino?: number | null;
}

export interface RegistrarMovimientoRequest {
  productoOrigenId: number;
  productoDestinoId: number;
  cantidadKg: number;
  observacion?: string;
}
