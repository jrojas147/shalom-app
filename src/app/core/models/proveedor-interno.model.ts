import { TipoDocumento } from './administrador-conjunto.model';

export type Sexo = 'M' | 'F';

export type Rh = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const SEXOS: { value: Sexo; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];

export const RH_VALUES: { value: Rh; label: string }[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

export interface ProveedorInternoHijo {
  id?: number;
  recicladorId?: number;
  documento: string;
  sexo?: Sexo;
  nombre: string;
  fechaNacimiento?: string;
}

export interface ProveedorInterno {
  id: number;
  comercioId: number;
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  fechaNacimiento?: string;
  sexo?: Sexo;
  email?: string;
  fechaIngreso?: string;
  arl?: string;
  eps?: string;
  telefono?: string;
  rh?: Rh;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  activo: boolean;
  hijos: ProveedorInternoHijo[];
}

export interface ProveedorInternoHijoRequest {
  documento: string;
  sexo?: Sexo;
  nombre: string;
  fechaNacimiento?: string;
}

export interface ProveedorInternoRequest {
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  fechaNacimiento?: string;
  sexo?: Sexo;
  email?: string;
  fechaIngreso?: string;
  arl?: string;
  eps?: string;
  telefono?: string;
  rh?: Rh;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  activo?: boolean;
  hijos?: ProveedorInternoHijoRequest[];
}
