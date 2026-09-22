export interface CarteraVenta {
  ventaId: number;
  numeroFactura: string;
  createdAt: string;
  total: number;
  saldoPendiente: number;
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
  saldoPendiente: number;
  ultimaVentaAt?: string | null;
  ventas: CarteraVenta[];
}
