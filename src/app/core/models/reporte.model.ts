import { MetodoPagoPreferido, TipoCliente } from './cliente.model';
import { TipoProveedor } from './proveedor.model';

export type ReporteCompraEstado = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';
export type ReporteCompraEstadoPago = 'PENDIENTE' | 'PAGADO';

export interface ReporteLinea {
  productoId: number;
  productoCodigo: string | null;
  productoNombre: string;
  pesoKg: number;
  unidades: number | null;
  empaque: string | null;
  cantidadEmpaques: number | null;
  precioUnitario: number;
  subtotal: number;
}

export interface ReporteCompra {
  id: number;
  numeroFactura: string;
  createdAt: string;
  confirmedAt: string | null;
  estado: ReporteCompraEstado;
  estadoPago: ReporteCompraEstadoPago;
  proveedorTipo: TipoProveedor;
  proveedorDocumento: string | null;
  proveedorNombre: string;
  sucursalNombre: string | null;
  pesoTotal: number;
  total: number;
  usuarioRegistro: string | null;
  detalle: ReporteLinea[];
}

export interface ReporteVenta {
  id: number;
  numeroFactura: string;
  createdAt: string;
  clienteDocumento: string | null;
  clienteNombre: string;
  pagoCredito: boolean;
  pesoTotal: number;
  total: number;
  saldoPendiente: number;
  fechaProyectadaPago: string | null;
  usuarioRegistro: string | null;
  detalle: ReporteLinea[];
}

export interface ReporteCliente {
  id: number;
  tipoCliente: TipoCliente;
  tipoDocumento: string;
  documento: string;
  nombre: string;
  telefonoCelular: string | null;
  telefonoFijo: string | null;
  email: string | null;
  direccion: string | null;
  municipio: string | null;
  departamento: string | null;
  metodoPagoPreferido: MetodoPagoPreferido | null;
  activo: boolean;
  createdAt: string;
}

export interface ReporteProveedor {
  id: number;
  tipo: TipoProveedor;
  tipoDocumento: string | null;
  documento: string | null;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  municipio: string | null;
  departamento: string | null;
  activo: boolean;
  createdAt: string;
}

export interface ReporteRangoFechas {
  desde: string;
  hasta: string;
}

export const ESTADOS_COMPRA_REPORTE: { value: ReporteCompraEstado; label: string }[] = [
  { value: 'CONFIRMADA', label: 'Confirmadas' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'CANCELADA', label: 'Anuladas' },
];

export function reporteCompraEstadoLabel(estado: ReporteCompraEstado): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'Pendiente';
    case 'CONFIRMADA':
      return 'Confirmada';
    case 'CANCELADA':
      return 'Anulada';
  }
}
