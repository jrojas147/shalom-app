import { EntidadBancaria } from './entidad-bancaria.model';
import { TipoCuenta } from './sucursal.model';

export type TipoPago = 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE';

export const TIPOS_PAGO: { value: TipoPago; label: string }[] = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CHEQUE', label: 'Cheque' },
];

export interface RecicladorAsociado {
  id: number;
  recicladorId: number;
  nombre: string;
  documento: string;
  activo: boolean;
}

export interface ProveedorEmpresa {
  id: number;
  comercioId: number;
  nit: string;
  razonSocial: string;
  personaContacto?: string;
  telefonoContacto?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoPago?: TipoPago;
  entidadBancariaId?: number;
  entidadBancaria?: EntidadBancaria;
  tipoCuenta?: TipoCuenta;
  numeroCuenta?: string;
  activo: boolean;
  recicladoresAsociados: RecicladorAsociado[];
}

export interface ProveedorEmpresaRequest {
  nit: string;
  razonSocial: string;
  personaContacto?: string;
  telefonoContacto?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoPago?: TipoPago;
  entidadBancariaId?: number;
  tipoCuenta?: TipoCuenta;
  numeroCuenta?: string;
  activo?: boolean;
  recicladorIds?: number[];
}
