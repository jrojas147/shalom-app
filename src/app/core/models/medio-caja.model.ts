export type MedioCajaTipo = 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'BANCO';

export const MEDIO_CAJA_TIPOS_CREABLES: Exclude<MedioCajaTipo, 'EFECTIVO'>[] = [
  'NEQUI',
  'DAVIPLATA',
  'BANCO',
];

export const MEDIO_CAJA_TIPO_LABEL: Record<MedioCajaTipo, string> = {
  EFECTIVO: 'Efectivo',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  BANCO: 'Cuenta bancaria',
};

export interface MedioCaja {
  id: number;
  comercioId: number;
  tipo: MedioCajaTipo;
  nombre: string;
  telefono?: string | null;
  numeroCuenta?: string | null;
  entidadBancariaId?: number | null;
  entidadBancariaNombre?: string | null;
  sistema: boolean;
  activo: boolean;
}

export interface MedioCajaRequest {
  tipo: MedioCajaTipo;
  nombre: string;
  telefono?: string | null;
  numeroCuenta?: string | null;
  entidadBancariaId?: number | null;
  activo?: boolean;
}

export function medioCajaDetalle(medio: Pick<
  MedioCaja,
  'tipo' | 'telefono' | 'numeroCuenta' | 'entidadBancariaNombre'
>): string {
  if (medio.tipo === 'NEQUI' || medio.tipo === 'DAVIPLATA') {
    return medio.telefono?.trim() || '';
  }
  if (medio.tipo === 'BANCO') {
    return [medio.entidadBancariaNombre, medio.numeroCuenta].filter(Boolean).join(' · ');
  }
  return 'Efectivo';
}
