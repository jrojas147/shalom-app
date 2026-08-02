export interface RetribucionInterno {
  recicladorId: number;
  nombre: string;
  tipoDocumento?: string | null;
  documento?: string | null;
  telefono?: string | null;
  activo: boolean;
  cantidadCompras: number;
  totalPendiente: number;
  pesoTotalPendiente: number;
}

export interface RetribucionExterno {
  proveedorId: number;
  nombre: string;
  tipoDocumento?: string | null;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  cantidadCompras: number;
  totalPendiente: number;
  pesoTotalPendiente: number;
}

/** Modelo unificado para validación/pago en UI. */
export interface RetribucionProveedorPendiente {
  proveedorId: number;
  nombre: string;
  tipoDocumento?: string | null;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  cantidadCompras: number;
  totalPendiente: number;
  pesoTotalPendiente: number;
  tipo: 'INTERNO' | 'EXTERNO';
}

export function mapInternoPendiente(item: RetribucionInterno): RetribucionProveedorPendiente {
  return {
    proveedorId: item.recicladorId,
    nombre: item.nombre,
    tipoDocumento: item.tipoDocumento,
    documento: item.documento,
    telefono: item.telefono,
    email: null,
    activo: item.activo,
    cantidadCompras: item.cantidadCompras,
    totalPendiente: item.totalPendiente,
    pesoTotalPendiente: item.pesoTotalPendiente,
    tipo: 'INTERNO',
  };
}

export function mapExternoPendiente(item: RetribucionExterno): RetribucionProveedorPendiente {
  return {
    proveedorId: item.proveedorId,
    nombre: item.nombre,
    tipoDocumento: item.tipoDocumento,
    documento: item.documento,
    telefono: item.telefono,
    email: item.email,
    activo: item.activo,
    cantidadCompras: item.cantidadCompras,
    totalPendiente: item.totalPendiente,
    pesoTotalPendiente: item.pesoTotalPendiente,
    tipo: 'EXTERNO',
  };
}
