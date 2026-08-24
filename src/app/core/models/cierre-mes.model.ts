export interface CierreMesTotales {
  productos: number;
  stockKg: number;
  stockUnidades: number;
  comprasKg: number;
  comprasUnidades: number;
  comprasTotal: number;
  ventasKg: number;
  ventasUnidades: number;
  ventasTotal: number;
}

export interface CierreMesProducto {
  productoId: number;
  idInterno: string;
  idVisible: string;
  nombreProducto: string;
  codigoSui: string;
  nombreSui: string;
  stockKg: number;
  stockUnidades: number;
  comprasKg: number;
  comprasUnidades: number;
  comprasTotal: number;
  ventasKg: number;
  ventasUnidades: number;
  ventasTotal: number;
  validado: boolean;
}

export interface CierreMesCategoria {
  codigoSui: string;
  nombreSui: string;
  productos: number;
  totales: CierreMesTotales;
  items: CierreMesProducto[];
}

export interface CierreMesResumen {
  id: number;
  periodoAnio: number;
  periodoMes: number;
  periodoLabel: string;
  periodoDesde: string;
  periodoHasta: string;
  diaCierre: number;
  usuarioRegistroId: number;
  usuarioNombre: string;
  observacion?: string | null;
  createdAt: string;
}

export interface CierreMesPreview {
  yaCerrado: boolean;
  cajaAbierta?: boolean;
  cierreId?: number | null;
  periodoAnio: number;
  periodoMes: number;
  periodoLabel: string;
  periodoDesde: string;
  periodoHasta: string;
  diaCierre: number;
  observacion?: string | null;
  usuarioNombre?: string | null;
  ultimoCierre?: CierreMesResumen | null;
  totales: CierreMesTotales;
  categorias: CierreMesCategoria[];
}

export interface EjecutarCierreMesRequest {
  productoIds: number[];
  observacion?: string | null;
}
