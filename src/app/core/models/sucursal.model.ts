import { AdministradorConjunto } from './administrador-conjunto.model';

export type TipoCuenta = 'AHORROS' | 'CORRIENTE';

export const TIPOS_CUENTA: { value: TipoCuenta; label: string }[] = [
  { value: 'AHORROS', label: 'Ahorros' },
  { value: 'CORRIENTE', label: 'Corriente' },
];

export interface Sucursal {
  id: number;
  comercioId: number;
  administradorId: number;
  administrador?: AdministradorConjunto;
  nit: string;
  nombre: string;
  numApartamentos: number;
  email?: string;
  departamento: string;
  municipio: string;
  direccion: string;
  banco?: string;
  numeroCuenta?: string;
  tipoCuenta?: TipoCuenta;
  fechaAlta: string;
  activo: boolean;
}

export interface SucursalRequest {
  administradorId: number;
  nit: string;
  nombre: string;
  numApartamentos: number;
  email?: string;
  departamento: string;
  municipio: string;
  direccion: string;
  banco?: string;
  numeroCuenta?: string;
  tipoCuenta?: TipoCuenta;
  fechaAlta?: string;
  activo?: boolean;
}
