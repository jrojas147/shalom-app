export interface PagoComprobanteItem {
  nombre: string;
  pesoKg: number;
  precioKg: number;
  total: number;
  empaque: string;
  unidades?: number;
}

export interface PagoComprobanteData {
  factura: string;
  fecha: Date;
  comercioNombre: string;
  usuarioNombre: string;
  usuarioUsername: string;
  beneficiarioNombre: string;
  beneficiarioDocumento?: string | null;
  sucursalNombre?: string | null;
  anticipoInicial?: number;
  items: PagoComprobanteItem[];
  total: number;
  totalCompra?: number;
  anticipoAplicado?: number;
  pesoTotal: number;
}
