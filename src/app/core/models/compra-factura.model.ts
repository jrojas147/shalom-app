import { CompraProveedorSeleccion } from './compra-proveedor.model';

export interface CompraFacturaItem {
  nombre: string;
  pesoKg: number;
  precioKg: number;
  total: number;
  empaque: string;
}

export interface CompraFacturaData {
  factura: string;
  fecha: Date;
  comercioNombre: string;
  usuarioNombre: string;
  usuarioUsername: string;
  proveedor: CompraProveedorSeleccion;
  items: CompraFacturaItem[];
  total: number;
  pesoTotal: number;
}
