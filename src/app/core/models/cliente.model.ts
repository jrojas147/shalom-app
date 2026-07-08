import { TipoDocumento, TIPOS_DOCUMENTO } from './administrador-conjunto.model';

export type TipoCliente = 'NATURAL' | 'EMPRESA';
export type SexoCliente = 'M' | 'F' | 'OTRO' | 'NO_APLICA';
export type MetodoPagoPreferido = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

export const TIPOS_CLIENTE: { value: TipoCliente; label: string }[] = [
  { value: 'NATURAL', label: 'Persona natural' },
  { value: 'EMPRESA', label: 'Empresa' },
];

export const SEXOS_CLIENTE: { value: SexoCliente; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
  { value: 'NO_APLICA', label: 'No aplica' },
];

export const METODOS_PAGO_CLIENTE: { value: MetodoPagoPreferido; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

export { TIPOS_DOCUMENTO };
export type { TipoDocumento };

export interface Cliente {
  id: number;
  comercioId: number;
  tipoCliente: TipoCliente;
  tipoDocumento: TipoDocumento;
  documento: string;
  nombre: string;
  fechaNacimiento?: string | null;
  sexo?: SexoCliente | null;
  telefonoFijo?: string | null;
  telefonoCelular?: string | null;
  email?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  municipio?: string | null;
  metodoPagoPreferido?: MetodoPagoPreferido | null;
  observaciones?: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteRequest {
  tipoCliente: TipoCliente;
  tipoDocumento: TipoDocumento;
  documento: string;
  nombre: string;
  fechaNacimiento?: string | null;
  sexo?: SexoCliente | null;
  telefonoFijo?: string | null;
  telefonoCelular?: string | null;
  email?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  municipio?: string | null;
  metodoPagoPreferido?: MetodoPagoPreferido | null;
  observaciones?: string | null;
  activo?: boolean;
}

export function tipoClienteLabel(tipo: TipoCliente): string {
  return TIPOS_CLIENTE.find((t) => t.value === tipo)?.label ?? tipo;
}

export function sexoClienteLabel(sexo?: SexoCliente | null): string {
  if (!sexo) return '—';
  return SEXOS_CLIENTE.find((s) => s.value === sexo)?.label ?? sexo;
}

export function metodoPagoLabel(metodo?: MetodoPagoPreferido | null): string {
  if (!metodo) return '—';
  return METODOS_PAGO_CLIENTE.find((m) => m.value === metodo)?.label ?? metodo;
}

export function documentoClienteLabel(cliente: Cliente): string {
  const tipo = TIPOS_DOCUMENTO.find((t) => t.value === cliente.tipoDocumento)?.label ?? cliente.tipoDocumento;
  return `${tipo} ${cliente.documento}`;
}
