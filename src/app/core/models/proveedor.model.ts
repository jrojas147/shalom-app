export type TipoProveedor = 'INTERNO' | 'EXTERNO' | 'EMPRESA';

export interface ProveedorSiigo {
  siigoId: string;
  identificacion: string;
  nombre: string;
  tipoDocumento: string;
  tipoProveedor: 'INTERNO' | 'EMPRESA';
  telefono?: string | null;
  email?: string | null;
  ciudad?: string | null;
  yaEnShalom: boolean;
}

export interface ImportarProveedoresSiigoResultado {
  importados: number;
  omitidos: number;
  mensajes: string[];
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
