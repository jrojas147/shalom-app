import { TipoProveedor } from './proveedor.model';

export interface CompraProveedorSeleccion {
  tipo: TipoProveedor;
  proveedorId: number;
  nombre: string;
  documento?: string;
  sucursalId?: number;
  sucursalNombre?: string;
  sucursalNit?: string;
  sucursalMunicipio?: string;
}

export function compraProveedorEtiqueta(seleccion: CompraProveedorSeleccion): string {
  if (seleccion.tipo === 'INTERNO' && seleccion.sucursalNombre) {
    return `${seleccion.nombre} — ${seleccion.sucursalNombre}`;
  }
  return seleccion.nombre;
}

export function compraProveedorTipoLabel(tipo: TipoProveedor): string {
  switch (tipo) {
    case 'INTERNO':
      return 'Interno';
    case 'EXTERNO':
      return 'Externo';
    case 'EMPRESA':
      return 'Empresa';
  }
}
