export interface CarteraVenta {
  ventaId: number;
  numeroFactura: string;
  createdAt: string;
  total: number;
  abonos: number;
  saldoPendiente: number;
  fechaProyectadaPago?: string | null;
}

export interface CarteraCliente {
  clienteId: number;
  nombre: string;
  tipoDocumento?: string | null;
  documento?: string | null;
  telefono?: string | null;
  tipoCliente?: string | null;
  cantidadVentas: number;
  totalVentas: number;
  totalAbonos?: number;
  saldoPendiente: number;
  ultimaVentaAt?: string | null;
  fechaProyectadaPago?: string | null;
  ventas: CarteraVenta[];
}

export interface RegistrarPagoCarteraPayload {
  medioCajaId: number;
  monto: number;
}

export interface CarteraPagoResponse {
  ventaId: number;
  numeroFactura: string;
  montoPagado: number;
  saldoPendiente: number;
  mensaje: string;
}
