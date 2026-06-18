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
    descripcion: 'Personal o colaboradores vinculados al comercio que proveen material.',
    nombreLabel: 'Nombre completo',
    documentoLabel: 'DNI',
    nombrePlaceholder: 'Nombre del colaborador',
  },
  {
    id: 'EXTERNO',
    label: 'Externos',
    descripcion: 'Personas o terceros independientes que entregan material al comercio.',
    nombreLabel: 'Nombre completo',
    documentoLabel: 'Documento',
    nombrePlaceholder: 'Nombre del proveedor',
  },
  {
    id: 'EMPRESA',
    label: 'Empresa',
    descripcion: 'Empresas o razones sociales registradas como proveedoras.',
    nombreLabel: 'Razón social',
    documentoLabel: 'CUIT',
    nombrePlaceholder: 'Nombre de la empresa',
  },
];
