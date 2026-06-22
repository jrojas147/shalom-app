export type TipoProveedor = 'INTERNO' | 'EXTERNO' | 'EMPRESA';

export interface Proveedor {
  id: number;
  tipo: TipoProveedor;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface ProveedorRequest {
  tipo: TipoProveedor;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

export interface ProveedorTabConfig {
  id: TipoProveedor;
  label: string;
  descripcion: string;
  nombreLabel: string;
  documentoLabel: string;
  nombrePlaceholder: string;
}

export const PROVEEDOR_TABS: ProveedorTabConfig[] = [
  {
    id: 'INTERNO',
    label: 'Internos',
    descripcion: 'Recicladores vinculados con sucursales asociados.',
    nombreLabel: 'Nombre completo',
    documentoLabel: 'Documento',
    nombrePlaceholder: 'Nombre del colaborador',
  },
  {
    id: 'EXTERNO',
    label: 'Externos',
    descripcion: 'Asociado que permite realizar facturacion de compras a recicladores de calle.',
    nombreLabel: 'Nombre completo',
    documentoLabel: 'Documento',
    nombrePlaceholder: 'Nombre del proveedor',
  },
  {
    id: 'EMPRESA',
    label: 'Empresa',
    descripcion: 'Empresas asociadas proveedoreas de Renovando Planeta.',
    nombreLabel: 'Razón social',
    documentoLabel: 'CUIT',
    nombrePlaceholder: 'Nombre de la empresa',
  },
];
