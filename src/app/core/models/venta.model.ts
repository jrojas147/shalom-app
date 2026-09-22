import { CompraDetalleItem } from './compra.model';
import { Cliente } from './cliente.model';

export interface VentaClienteSeleccion {
  clienteId: number;
  nombre: string;
  documento: string;
  tipoCliente: Cliente['tipoCliente'];
}

export interface RegistrarVentaPayload {
  cliente: VentaClienteSeleccion;
  items: CompraDetalleItem[];
  total: number;
  pesoTotal: number;
  medioCajaId?: number | null;
  pagoCredito?: boolean;
  fechaProyectadaPago?: string | null;
}

export interface VentaResumen {
  totalHoy: number;
  pesoHoy: number;
  cantidadHoy: number;
  totalSemana: number;
  pesoSemana: number;
  cantidadSemana: number;
  totalMes: number;
  pesoMes: number;
  cantidadMes: number;
}

export interface RegistrarVentaResponse {
  ventaId: number;
  factura: string;
  mensaje: string;
  total: number;
  pesoTotal: number;
  pagoCredito?: boolean;
  saldoPendiente?: number;
}

export function ventaClienteEtiqueta(cliente: VentaClienteSeleccion): string {
  return `${cliente.nombre} (${cliente.documento})`;
}
