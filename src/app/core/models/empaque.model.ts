export type EmpaqueContraparteTipo = 'PROVEEDOR_INTERNO' | 'CLIENTE';
export type EmpaqueOperacion = 'ENTREGAR' | 'RECIBIR' | 'INGRESO' | 'BAJA';
export type EmpaqueReferenciaTipo = 'MANUAL' | 'COMPRA' | 'VENTA' | 'BODEGA';
export type EmpaqueBodegaOperacion = 'INGRESO' | 'BAJA';

export interface EmpaqueSaldo {
  id: number;
  contraparteTipo: EmpaqueContraparteTipo;
  contraparteId: number;
  contraparteNombre: string;
  tipoEmpaqueId: number;
  tipoEmpaqueNombre: string;
  ellosTienen: number;
  yoTengo: number;
}

export interface EmpaqueBodega {
  tipoEmpaqueId: number;
  tipoEmpaqueNombre: string;
  enBodega: number;
  deProveedores: number;
  enProveedores: number;
  enClientes: number;
}

export interface EmpaqueMovimiento {
  id: number;
  contraparteTipo?: EmpaqueContraparteTipo | null;
  contraparteId?: number | null;
  contraparteNombre: string;
  tipoEmpaqueId: number;
  tipoEmpaqueNombre: string;
  operacion: EmpaqueOperacion;
  cantidad: number;
  ellosTienenDelta: number;
  yoTengoDelta: number;
  bodegaDelta: number;
  referenciaTipo: EmpaqueReferenciaTipo;
  referenciaId?: number | null;
  observacion?: string | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre?: string | null;
  createdAt: string;
}

export interface EmpaqueResumen {
  proveedoresEllosTienen: number;
  proveedoresYoTengo: number;
  clientesEllosTienen: number;
  bodegaCantidad: number;
}

export interface RegistrarEmpaqueMovimientoRequest {
  contraparteTipo: EmpaqueContraparteTipo;
  contraparteId: number;
  tipoEmpaqueId: number;
  cantidad: number;
  operacion: 'ENTREGAR' | 'RECIBIR';
  observacion?: string;
}

export interface RegistrarEmpaqueBodegaRequest {
  tipoEmpaqueId: number;
  cantidad: number;
  operacion: EmpaqueBodegaOperacion;
  observacion?: string;
}

export function empaqueOperacionLabel(operacion: EmpaqueOperacion): string {
  switch (operacion) {
    case 'ENTREGAR':
      return 'Entregar';
    case 'RECIBIR':
      return 'Recibir';
    case 'INGRESO':
      return 'Ingreso';
    case 'BAJA':
      return 'Baja';
    default:
      return operacion;
  }
}

export function empaqueReferenciaLabel(tipo: EmpaqueReferenciaTipo): string {
  switch (tipo) {
    case 'COMPRA':
      return 'Pre-compra';
    case 'VENTA':
      return 'Venta';
    case 'BODEGA':
      return 'Bodega';
    default:
      return 'Manual';
  }
}

export function empaqueContraparteTipoLabel(tipo?: EmpaqueContraparteTipo | null): string {
  if (tipo === 'PROVEEDOR_INTERNO') {
    return 'Proveedor interno';
  }
  if (tipo === 'CLIENTE') {
    return 'Cliente';
  }
  return 'Bodega';
}
